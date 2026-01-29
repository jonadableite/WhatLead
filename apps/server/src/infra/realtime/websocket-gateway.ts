import { auth } from "@WhatLead/auth";
import prisma from "@WhatLead/db";
import { createChildLogger } from "@WhatLead/logger";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { SocketStream } from "@fastify/websocket";
import { z } from "zod";
import { randomUUID } from "crypto";
import { WebSocket } from "ws";
import type { RawData } from "ws";

interface RealtimeConnection {
	id: string;
	socket: SocketStream["socket"];
	tenantId: string;
	userId: string;
	instanceId?: string;
}

export interface RealtimeGatewayEvent {
	organizationId: string;
	instanceId?: string | null;
	type: string;
	payload: unknown;
}

interface RealtimeRequest extends FastifyRequest {
	realtimeTenantId?: string;
	realtimeUserId?: string;
}

const subscribeMessageSchema = z.object({
	type: z.literal("subscribe"),
	instanceId: z.string().min(1).optional(),
	organizationId: z.string().min(1).optional(),
});

const unsubscribeMessageSchema = z.object({
	type: z.literal("unsubscribe"),
});

const realtimeMessageSchema = z.union([subscribeMessageSchema, unsubscribeMessageSchema]);

export class WebSocketGateway {
	private readonly connections = new Map<string, RealtimeConnection>();
	private readonly logger = createChildLogger({ component: "realtime_gateway" });

	async register(fastify: FastifyInstance): Promise<void> {
		await fastify.register(async (instance) => {
			instance.get(
				"/realtime",
				{
					websocket: true,
					preHandler: async (request, reply) => {
						const session = await resolveSession(request.headers);
						if (!session) {
							return reply.status(401).send({ error: "UNAUTHORIZED" });
						}

						const tenantId = await resolveTenantId(session);
						if (!tenantId) {
							return reply.status(403).send({ error: "FORBIDDEN" });
						}

						(request as RealtimeRequest).realtimeTenantId = tenantId;
						(request as RealtimeRequest).realtimeUserId = session.userId;
					},
				},
				(connection, request) => {
					const realtimeRequest = request as RealtimeRequest;
					const tenantId = realtimeRequest.realtimeTenantId;
					const userId = realtimeRequest.realtimeUserId;
					if (!tenantId || !userId) {
						connection.socket.close(1008, "Unauthorized");
						return;
					}

					const connectionId = randomUUID();
					const client: RealtimeConnection = {
						id: connectionId,
						socket: connection.socket,
						tenantId,
						userId,
					};
					this.connections.set(connectionId, client);

					this.logger.info({
						event: "realtime_connected",
						connectionId,
						tenantId,
						userId,
					});

					connection.socket.on("message", async (data) => {
						await this.handleMessage({ client, data });
					});

					connection.socket.on("close", () => {
						this.connections.delete(connectionId);
						this.logger.info({
							event: "realtime_disconnected",
							connectionId,
							tenantId,
							userId,
						});
					});
				},
			);
		});
	}

	broadcast(event: RealtimeGatewayEvent): void {
		const payload = JSON.stringify({
			type: event.type,
			payload: event.payload,
		});

		for (const connection of this.connections.values()) {
			if (connection.tenantId !== event.organizationId) {
				continue;
			}

			if (event.instanceId && connection.instanceId !== event.instanceId) {
				continue;
			}

			if (connection.socket.readyState !== WebSocket.OPEN) {
				continue;
			}

			try {
				connection.socket.send(payload);
			} catch (error) {
				this.logger.warn({
					event: "realtime_send_failed",
					connectionId: connection.id,
					error,
				});
			}
		}
	}

	private async handleMessage(params: {
		client: RealtimeConnection;
		data: RawData;
	}): Promise<void> {
		const message = parseJsonMessage(params.data);
		if (!message) {
			this.send(params.client, {
				type: "error",
				message: "INVALID_JSON",
			});
			return;
		}

		const parsed = realtimeMessageSchema.safeParse(message);
		if (!parsed.success) {
			this.send(params.client, {
				type: "error",
				message: "INVALID_MESSAGE",
			});
			return;
		}

		if (parsed.data.type === "unsubscribe") {
			params.client.instanceId = undefined;
			this.send(params.client, { type: "unsubscribed" });
			return;
		}

		const instanceId = parsed.data.instanceId?.trim();
		if (instanceId) {
			const allowed = await canAccessInstance({
				tenantId: params.client.tenantId,
				instanceId,
			});
			if (!allowed) {
				this.send(params.client, {
					type: "error",
					message: "INSTANCE_NOT_FOUND",
				});
				return;
			}
		}

		if (
			parsed.data.organizationId &&
			parsed.data.organizationId !== params.client.tenantId
		) {
			this.send(params.client, {
				type: "error",
				message: "ORG_MISMATCH",
			});
			return;
		}

		params.client.instanceId = instanceId;
		this.send(params.client, {
			type: "subscribed",
			instanceId: instanceId ?? null,
		});
	}

	private send(
		client: RealtimeConnection,
		message: { type: string; message?: string; instanceId?: string | null },
	): void {
		if (client.socket.readyState !== WebSocket.OPEN) {
			return;
		}
		client.socket.send(JSON.stringify(message));
	}
}

const parseJsonMessage = (data: RawData): unknown | null => {
	if (typeof data === "string") {
		return safeParseJson(data);
	}

	if (data instanceof Buffer) {
		return safeParseJson(data.toString("utf-8"));
	}

	if (Array.isArray(data)) {
		const merged = Buffer.concat(data);
		return safeParseJson(merged.toString("utf-8"));
	}

	if (data instanceof ArrayBuffer) {
		return safeParseJson(Buffer.from(data).toString("utf-8"));
	}

	return null;
};

const safeParseJson = (value: string): unknown | null => {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

const canAccessInstance = async (params: {
	tenantId: string;
	instanceId: string;
}): Promise<boolean> => {
	const instance = await prisma.instance.findFirst({
		where: {
			id: params.instanceId,
			tenantId: params.tenantId,
		},
		select: { id: true },
	});
	return Boolean(instance);
};

const resolveSession = async (
	headers: FastifyRequest["headers"],
): Promise<{ userId: string; tenantId?: string | null } | null> => {
	type SessionHeaders = Parameters<typeof auth.api.getSession>[0]["headers"];
	const session = await auth.api.getSession({
		headers: headers as SessionHeaders,
	});
	if (!session || typeof session !== "object") {
		return null;
	}

	const sessionRecord = session as {
		user?: { id?: string };
		session?: { activeOrganizationId?: string | null };
	};

	const userId = sessionRecord.user?.id;
	if (!userId) {
		return null;
	}

	return {
		userId,
		tenantId: sessionRecord.session?.activeOrganizationId ?? null,
	};
};

const resolveTenantId = async (session: {
	userId: string;
	tenantId?: string | null;
}): Promise<string | null> => {
	if (session.tenantId) {
		return session.tenantId;
	}

	const member = await prisma.member.findFirst({
		where: { userId: session.userId },
		select: { organizationId: true },
		orderBy: { createdAt: "asc" },
	});
	return member?.organizationId ?? null;
};

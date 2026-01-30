import prisma from "@WhatLead/db";
import type { FastifyInstance } from "fastify";

import { auth } from "@WhatLead/auth";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import {
	CONVERSATION_STATUSES,
	type ConversationStatus,
} from "../../domain/value-objects/conversation-status";
import type { ListConversationsUseCase } from "../../application/conversations/list-conversations.use-case";
import type { SendChatMessageUseCase } from "../../application/conversations/send-chat-message.use-case";

interface SendMessageBody {
	body: string;
}

const resolveTenantId = async (
	headers: Record<string, unknown>,
): Promise<string | null> => {
	const session = await auth.api.getSession({ headers: headers as any });
	if (!session) return null;

	const userId = (session as any).user?.id as string | undefined;
	const activeOrgId = (session as any).session?.activeOrganizationId as string | undefined;
	if (activeOrgId) return activeOrgId;
	if (!userId) return null;

	const member = await prisma.member.findFirst({
		where: { userId },
		select: { organizationId: true },
		orderBy: { createdAt: "asc" },
	});
	return member?.organizationId ?? null;
};

export const registerConversationRoutes = async (
	fastify: FastifyInstance,
	options: {
		listConversations: ListConversationsUseCase;
		sendChatMessage: SendChatMessageUseCase;
		conversationRepository: ConversationRepository;
	},
): Promise<void> => {
	fastify.get("/api/conversations", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const query = request.query as {
			instanceId?: string;
			status?: string;
			search?: string;
			operatorId?: string;
			includeUnassigned?: string;
			limit?: string;
			offset?: string;
		};

		const instanceId = String(query.instanceId ?? "").trim();
		if (!instanceId) {
			return reply.status(400).send({ message: "instanceId é obrigatório" });
		}

		const status = parseConversationStatus(query.status);
		if (query.status && !status) {
			return reply.status(400).send({ message: "status inválido" });
		}

		const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
		if (query.limit && Number.isNaN(limit)) {
			return reply.status(400).send({ message: "limit inválido" });
		}

		const offset = query.offset ? Number.parseInt(query.offset, 10) : undefined;
		if (query.offset && Number.isNaN(offset)) {
			return reply.status(400).send({ message: "offset inválido" });
		}

		const includeUnassigned =
			typeof query.includeUnassigned === "string"
				? query.includeUnassigned !== "false"
				: undefined;

		const result = await options.listConversations.execute({
			tenantId,
			instanceId,
			status,
			search: query.search?.trim() || undefined,
			operatorId: query.operatorId?.trim() || undefined,
			includeUnassigned,
			limit,
			offset,
		});

		return reply.send(result);
	});

	fastify.get("/api/conversations/:id/messages", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		const query = request.query as { limit?: string; cursor?: string };

		const limit = query.limit ? Number.parseInt(query.limit, 10) : 50;
		if (query.limit && Number.isNaN(limit)) {
			return reply.status(400).send({ message: "limit inválido" });
		}

		const conversation = await options.conversationRepository.findById({
			id: params.id,
		});
		if (!conversation || conversation.tenantId !== tenantId) {
			return reply.status(404).send({ error: "CONVERSATION_NOT_FOUND" });
		}

		const result = await options.conversationRepository.getMessagesWithContent({
			conversationId: params.id,
			limit: Math.min(Math.max(limit, 1), 200),
			cursor: query.cursor,
		});

		return reply.send({
			items: result.items.map((item) => ({
				id: item.id,
				direction: item.direction,
				type: item.type,
				sentBy: item.sentBy,
				status: item.status,
				body: item.body,
				occurredAt: item.occurredAt.toISOString(),
			})),
			nextCursor: result.nextCursor,
		});
	});

	fastify.post("/api/conversations/:id/messages", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		const body = request.body as SendMessageBody;
		const messageBody = String(body?.body ?? "").trim();
		if (!messageBody) {
			return reply.status(400).send({ message: "mensagem é obrigatória" });
		}

		try {
			const result = await options.sendChatMessage.execute({
				tenantId,
				conversationId: params.id,
				body: messageBody,
			});
			return reply.status(201).send(result);
		} catch (error) {
			if (error instanceof Error && error.message === "CONVERSATION_NOT_FOUND") {
				return reply.status(404).send({ error: "CONVERSATION_NOT_FOUND" });
			}
			if (error instanceof Error && error.message === "EMPTY_MESSAGE") {
				return reply.status(400).send({ message: "mensagem é obrigatória" });
			}
			if (error instanceof Error && error.message === "RECIPIENT_NOT_FOUND") {
				return reply.status(400).send({ message: "destinatario inválido" });
			}
			return reply.status(500).send({ error: "SEND_MESSAGE_FAILED" });
		}
	});
};

const parseConversationStatus = (value?: string): ConversationStatus | undefined => {
	if (!value) return undefined;
	return CONVERSATION_STATUSES.includes(value as ConversationStatus)
		? (value as ConversationStatus)
		: undefined;
};

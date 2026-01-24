import prisma from "@WhatLead/db";
import type { FastifyInstance } from "fastify";

import { auth } from "@WhatLead/auth";
import type { CreateMessageIntentUseCase } from "../../application/message-intents/create-message-intent.use-case";
import type { DecideMessageIntentUseCase } from "../../application/message-intents/decide-message-intent.use-case";
import type { GetMessageIntentUseCase } from "../../application/message-intents/get-message-intent.use-case";
import type { ListMessageIntentsUseCase } from "../../application/message-intents/list-message-intents.use-case";
import type { MessageIntentPayload } from "../../domain/value-objects/message-intent-payload";
import {
	MESSAGE_INTENT_PURPOSES,
	type MessageIntentPurpose,
} from "../../domain/value-objects/message-intent-purpose";
import {
	MESSAGE_INTENT_STATUSES,
	type MessageIntentStatus,
} from "../../domain/value-objects/message-intent-status";
import type { MessageIntentType } from "../../domain/value-objects/message-intent-type";
import type { MessageTarget } from "../../domain/value-objects/message-target";

interface CreateMessageIntentBody {
	target: MessageTarget;
	type: MessageIntentType;
	purpose: MessageIntentPurpose;
	payload: MessageIntentPayload;
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

export const registerMessageIntentRoutes = async (
	fastify: FastifyInstance,
	options: {
		createMessageIntent: CreateMessageIntentUseCase;
		decideMessageIntent: DecideMessageIntentUseCase;
		getMessageIntent: GetMessageIntentUseCase;
		listMessageIntents: ListMessageIntentsUseCase;
	},
): Promise<void> => {
	fastify.get("/api/message-intents", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const query = request.query as {
			status?: string;
			purpose?: string;
			instanceId?: string;
			limit?: string;
		};

		const status = parseMessageIntentStatus(query.status);
		if (query.status && !status) {
			return reply.status(400).send({ message: "status inválido" });
		}

		const purpose = parseMessageIntentPurpose(query.purpose);
		if (query.purpose && !purpose) {
			return reply.status(400).send({ message: "purpose inválido" });
		}

		const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
		if (query.limit && Number.isNaN(limit)) {
			return reply.status(400).send({ message: "limit inválido" });
		}

		const result = await options.listMessageIntents.execute({
			organizationId: tenantId,
			status,
			purpose,
			instanceId: query.instanceId,
			limit,
		});

		return reply.send(result);
	});

	fastify.post("/api/message-intents", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const body = request.body as CreateMessageIntentBody;
		if (!body?.target?.kind || !body?.target?.value) {
			return reply.status(400).send({ message: "target é obrigatório" });
		}
		if (!body?.type) return reply.status(400).send({ message: "type é obrigatório" });
		if (!body?.purpose) return reply.status(400).send({ message: "purpose é obrigatório" });
		if (!body?.payload) return reply.status(400).send({ message: "payload é obrigatório" });

		const result = await options.createMessageIntent.execute({
			organizationId: tenantId,
			target: body.target,
			type: body.type,
			purpose: body.purpose,
			payload: body.payload,
		});

		return reply.status(201).send(result);
	});

	fastify.get("/api/message-intents/:id", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.getMessageIntent.execute({
				organizationId: tenantId,
				intentId: params.id,
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "MESSAGE_INTENT_NOT_FOUND" });
		}
	});

	fastify.post("/api/message-intents/:id/decide", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.decideMessageIntent.execute({
				intentId: params.id,
				organizationId: tenantId,
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "MESSAGE_INTENT_NOT_FOUND" });
		}
	});
};

const parseMessageIntentStatus = (value?: string): MessageIntentStatus | undefined => {
	if (!value) return undefined;
	return MESSAGE_INTENT_STATUSES.includes(value as MessageIntentStatus)
		? (value as MessageIntentStatus)
		: undefined;
};

const parseMessageIntentPurpose = (value?: string): MessageIntentPurpose | undefined => {
	if (!value) return undefined;
	return MESSAGE_INTENT_PURPOSES.includes(value as MessageIntentPurpose)
		? (value as MessageIntentPurpose)
		: undefined;
};


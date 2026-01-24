import prisma from "@WhatLead/db";
import type { FastifyInstance } from "fastify";

import { auth } from "@WhatLead/auth";
import type { CreateMessageIntentUseCase } from "../../application/message-intents/create-message-intent.use-case";
import type { DecideMessageIntentUseCase } from "../../application/message-intents/decide-message-intent.use-case";
import type { MessageIntentPayload } from "../../domain/value-objects/message-intent-payload";
import type { MessageIntentPurpose } from "../../domain/value-objects/message-intent-purpose";
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
	},
): Promise<void> => {
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


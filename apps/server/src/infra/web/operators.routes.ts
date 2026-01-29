import prisma from "@WhatLead/db";
import type { FastifyInstance } from "fastify";

import { auth } from "@WhatLead/auth";
import type { AssignConversationToOperatorUseCase } from "../../application/operators/assign-conversation-to-operator.use-case";
import type { GetOperatorByUserUseCase } from "../../application/operators/get-operator-by-user.use-case";
import type { ListAvailableOperatorsUseCase } from "../../application/operators/list-available-operators.use-case";
import type { ReleaseConversationUseCase } from "../../application/operators/release-conversation.use-case";
import type { TransferConversationUseCase } from "../../application/operators/transfer-conversation.use-case";
import {
    OPERATOR_STATUSES,
    type OperatorStatus,
} from "../../domain/value-objects/operator-status";

interface AssignConversationBody {
	conversationId: string;
	operatorId: string;
}

interface ReleaseConversationBody {
	conversationId: string;
	operatorId: string;
}

interface TransferConversationBody {
	conversationId: string;
	fromOperatorId: string;
	toOperatorId: string;
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

const resolveSessionUserId = async (
	headers: Record<string, unknown>,
): Promise<string | null> => {
	const session = await auth.api.getSession({ headers: headers as any });
	const userId = (session as any)?.user?.id as string | undefined;
	return userId ?? null;
};

export const registerOperatorRoutes = async (
	fastify: FastifyInstance,
	options: {
		getOperatorByUser: GetOperatorByUserUseCase;
		listAvailableOperators: ListAvailableOperatorsUseCase;
		assignConversationToOperator: AssignConversationToOperatorUseCase;
		releaseConversation: ReleaseConversationUseCase;
		transferConversation: TransferConversationUseCase;
	},
): Promise<void> => {
	fastify.get("/api/operators/me", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const userId = await resolveSessionUserId(request.headers as any);
		if (!userId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const result = await options.getOperatorByUser.execute({
			organizationId: tenantId,
			userId,
		});

		return reply.send(result);
	});

	fastify.get("/api/operators", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const query = request.query as { status?: string; limit?: string };
		const status = parseOperatorStatus(query.status);
		if (query.status && !status) {
			return reply.status(400).send({ message: "status inválido" });
		}

		const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
		if (query.limit && Number.isNaN(limit)) {
			return reply.status(400).send({ message: "limit inválido" });
		}

		const result = await options.listAvailableOperators.execute({
			organizationId: tenantId,
			status,
			limit,
		});

		return reply.send(result);
	});

	fastify.post("/api/operators/assign", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const body = request.body as AssignConversationBody;
		if (!body?.conversationId || !body?.operatorId) {
			return reply.status(400).send({ message: "conversationId e operatorId são obrigatórios" });
		}

		try {
			await options.assignConversationToOperator.execute({
				organizationId: tenantId,
				conversationId: body.conversationId,
				operatorId: body.operatorId,
			});
			return reply.status(204).send();
		} catch (error) {
			if (error instanceof Error && error.message === "CONVERSATION_NOT_FOUND") {
				return reply.status(404).send({ error: "CONVERSATION_NOT_FOUND" });
			}
			if (error instanceof Error && error.message === "OPERATOR_NOT_FOUND") {
				return reply.status(404).send({ error: "OPERATOR_NOT_FOUND" });
			}
			if (error instanceof Error && error.message === "CONVERSATION_ALREADY_ASSIGNED") {
				return reply.status(409).send({ error: "CONVERSATION_ALREADY_ASSIGNED" });
			}
			if (error instanceof Error && error.message === "OPERATOR_UNAVAILABLE") {
				return reply.status(409).send({ error: "OPERATOR_UNAVAILABLE" });
			}
			return reply.status(500).send({ error: "OPERATOR_ASSIGN_FAILED" });
		}
	});

	fastify.post("/api/operators/release", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const body = request.body as ReleaseConversationBody;
		if (!body?.conversationId || !body?.operatorId) {
			return reply.status(400).send({ message: "conversationId e operatorId são obrigatórios" });
		}

		try {
			await options.releaseConversation.execute({
				organizationId: tenantId,
				conversationId: body.conversationId,
				operatorId: body.operatorId,
			});
			return reply.status(204).send();
		} catch (error) {
			if (error instanceof Error && error.message === "CONVERSATION_NOT_FOUND") {
				return reply.status(404).send({ error: "CONVERSATION_NOT_FOUND" });
			}
			if (error instanceof Error && error.message === "OPERATOR_NOT_FOUND") {
				return reply.status(404).send({ error: "OPERATOR_NOT_FOUND" });
			}
			if (error instanceof Error && error.message === "OPERATOR_NOT_ASSIGNED") {
				return reply.status(409).send({ error: "OPERATOR_NOT_ASSIGNED" });
			}
			return reply.status(500).send({ error: "OPERATOR_RELEASE_FAILED" });
		}
	});

	fastify.post("/api/operators/transfer", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const body = request.body as TransferConversationBody;
		if (!body?.conversationId || !body?.fromOperatorId || !body?.toOperatorId) {
			return reply
				.status(400)
				.send({ message: "conversationId, fromOperatorId e toOperatorId são obrigatórios" });
		}

		try {
			await options.transferConversation.execute({
				organizationId: tenantId,
				conversationId: body.conversationId,
				fromOperatorId: body.fromOperatorId,
				toOperatorId: body.toOperatorId,
			});
			return reply.status(204).send();
		} catch (error) {
			if (error instanceof Error && error.message === "CONVERSATION_NOT_FOUND") {
				return reply.status(404).send({ error: "CONVERSATION_NOT_FOUND" });
			}
			if (error instanceof Error && error.message === "OPERATOR_NOT_FOUND") {
				return reply.status(404).send({ error: "OPERATOR_NOT_FOUND" });
			}
			if (error instanceof Error && error.message === "OPERATOR_NOT_ASSIGNED") {
				return reply.status(409).send({ error: "OPERATOR_NOT_ASSIGNED" });
			}
			if (error instanceof Error && error.message === "OPERATOR_UNAVAILABLE") {
				return reply.status(409).send({ error: "OPERATOR_UNAVAILABLE" });
			}
			return reply.status(500).send({ error: "OPERATOR_TRANSFER_FAILED" });
		}
	});
};

const parseOperatorStatus = (value?: string): OperatorStatus | undefined => {
	if (!value) return undefined;
	return OPERATOR_STATUSES.includes(value as OperatorStatus)
		? (value as OperatorStatus)
		: undefined;
};

import prisma from "@WhatLead/db";
import type { FastifyInstance } from "fastify";

import { auth } from "@WhatLead/auth";
import type { ListExecutionJobsUseCase } from "../../application/execution/list-execution-jobs.use-case";
import {
	MESSAGE_EXECUTION_STATUSES,
	type MessageExecutionStatus,
} from "../../domain/value-objects/message-execution-status";

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

export const registerExecutionJobsRoutes = async (
	fastify: FastifyInstance,
	options: {
		listExecutionJobs: ListExecutionJobsUseCase;
	},
): Promise<void> => {
	fastify.get("/api/execution-jobs", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const query = request.query as {
			intentId?: string;
			status?: string;
			limit?: string;
		};

		if (!query.intentId) {
			return reply.status(400).send({ message: "intentId é obrigatório" });
		}

		const status = parseMessageExecutionStatus(query.status);
		if (query.status && !status) {
			return reply.status(400).send({ message: "status inválido" });
		}

		const limit = query.limit ? Number.parseInt(query.limit, 10) : undefined;
		if (query.limit && Number.isNaN(limit)) {
			return reply.status(400).send({ message: "limit inválido" });
		}

		try {
			const result = await options.listExecutionJobs.execute({
				organizationId: tenantId,
				intentId: query.intentId,
				status,
				limit,
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "MESSAGE_INTENT_NOT_FOUND" });
		}
	});
};

const parseMessageExecutionStatus = (
	value?: string,
): MessageExecutionStatus | undefined => {
	if (!value) return undefined;
	return MESSAGE_EXECUTION_STATUSES.includes(value as MessageExecutionStatus)
		? (value as MessageExecutionStatus)
		: undefined;
};

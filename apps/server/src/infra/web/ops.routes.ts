import prisma from "@WhatLead/db";
import type { FastifyInstance } from "fastify";

import { auth } from "@WhatLead/auth";
import type { GetExecutionMetricsUseCase } from "../../application/ops/get-execution-metrics.use-case";
import type { GetMessageIntentTimelineUseCase } from "../../application/ops/get-message-intent-timeline.use-case";
import type { PauseInstanceUseCase } from "../../application/ops/pause-instance.use-case";
import type { PauseOrganizationUseCase } from "../../application/ops/pause-organization.use-case";
import type { ResumeInstanceUseCase } from "../../application/ops/resume-instance.use-case";
import type { ResumeOrganizationUseCase } from "../../application/ops/resume-organization.use-case";

const requireOrgAdmin = async (
	headers: Record<string, unknown>,
): Promise<{ organizationId: string } | null> => {
	const session = await auth.api.getSession({ headers: headers as any });
	if (!session) return null;

	const userId = (session as any).user?.id as string | undefined;
	const activeOrgId = (session as any).session?.activeOrganizationId as string | undefined;
	if (!userId) return null;

	const organizationId =
		activeOrgId ??
		(
			await prisma.member.findFirst({
				where: { userId },
				select: { organizationId: true },
				orderBy: { createdAt: "asc" },
			})
		)?.organizationId;

	if (!organizationId) return null;

	const member = await prisma.member.findUnique({
		where: { organizationId_userId: { organizationId, userId } },
		select: { role: true },
	});

	if (!member || (member.role !== "owner" && member.role !== "admin")) return null;
	return { organizationId };
};

export const registerOpsRoutes = async (
	fastify: FastifyInstance,
	options: {
		getExecutionMetrics: GetExecutionMetricsUseCase;
		pauseInstance: PauseInstanceUseCase;
		resumeInstance: ResumeInstanceUseCase;
		pauseOrganization: PauseOrganizationUseCase;
		resumeOrganization: ResumeOrganizationUseCase;
		getMessageIntentTimeline: GetMessageIntentTimelineUseCase;
	},
): Promise<void> => {
	fastify.get("/api/ops/metrics", async (request, reply) => {
		const admin = await requireOrgAdmin(request.headers as any);
		if (!admin) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const windowMinutes = Number((request.query as any)?.window ?? 60);
		const result = await options.getExecutionMetrics.execute({
			organizationId: admin.organizationId,
			windowMinutes,
		});
		return reply.send(result);
	});

	fastify.get("/api/ops/instances/:id/metrics", async (request, reply) => {
		const admin = await requireOrgAdmin(request.headers as any);
		if (!admin) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		const instance = await prisma.instance.findFirst({
			where: { id: params.id, tenantId: admin.organizationId },
			select: { id: true },
		});
		if (!instance) return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });

		const windowMinutes = Number((request.query as any)?.window ?? 60);
		const result = await options.getExecutionMetrics.execute({
			organizationId: admin.organizationId,
			instanceId: params.id,
			windowMinutes,
		});
		return reply.send(result);
	});

	fastify.post("/api/ops/instances/:id/pause", async (request, reply) => {
		const admin = await requireOrgAdmin(request.headers as any);
		if (!admin) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		const instance = await prisma.instance.findFirst({
			where: { id: params.id, tenantId: admin.organizationId },
			select: { id: true },
		});
		if (!instance) return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });

		const body = (request.body ?? {}) as { reason?: string; until?: string | null };
		const until = body.until ? new Date(body.until) : null;
		await options.pauseInstance.execute({
			instanceId: params.id,
			reason: body.reason,
			until,
		});
		return reply.send({ ok: true });
	});

	fastify.post("/api/ops/instances/:id/resume", async (request, reply) => {
		const admin = await requireOrgAdmin(request.headers as any);
		if (!admin) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		const instance = await prisma.instance.findFirst({
			where: { id: params.id, tenantId: admin.organizationId },
			select: { id: true },
		});
		if (!instance) return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });

		await options.resumeInstance.execute({ instanceId: params.id });
		return reply.send({ ok: true });
	});

	fastify.post("/api/ops/organization/pause", async (request, reply) => {
		const admin = await requireOrgAdmin(request.headers as any);
		if (!admin) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const body = (request.body ?? {}) as { reason?: string; until?: string | null };
		const until = body.until ? new Date(body.until) : null;
		await options.pauseOrganization.execute({
			organizationId: admin.organizationId,
			reason: body.reason,
			until,
		});
		return reply.send({ ok: true });
	});

	fastify.post("/api/ops/organization/resume", async (request, reply) => {
		const admin = await requireOrgAdmin(request.headers as any);
		if (!admin) return reply.status(401).send({ error: "UNAUTHORIZED" });

		await options.resumeOrganization.execute({ organizationId: admin.organizationId });
		return reply.send({ ok: true });
	});

	fastify.get("/api/ops/message-intents/:id/timeline", async (request, reply) => {
		const admin = await requireOrgAdmin(request.headers as any);
		if (!admin) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const out = await options.getMessageIntentTimeline.execute({
				intentId: params.id,
				organizationId: admin.organizationId,
				limit: Number((request.query as any)?.limit ?? 200),
			});
			return reply.send(out);
		} catch {
			return reply.status(404).send({ error: "MESSAGE_INTENT_NOT_FOUND" });
		}
	});
};

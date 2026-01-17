import prisma from "@WhatLead/db";
import type { FastifyInstance } from "fastify";
import type { DispatchGateDecisionQueryPort } from "../../application/dispatch-gate/dispatch-gate-decision-query-port";
import type { StartSdrFlowUseCase } from "../../application/sdr/start-sdr-flow.use-case";

export const registerSdrFlowRoutes = async (
	fastify: FastifyInstance,
	options: {
		startSdrFlow: StartSdrFlowUseCase;
		gateDecisions: DispatchGateDecisionQueryPort;
	},
): Promise<void> => {
	fastify.post("/api/sdr/leads", async (request, reply) => {
		const body = request.body as any;
		const now = new Date();

		const result = await options.startSdrFlow.execute({
			instanceId: String(body.instanceId),
			contactId: String(body.contactId),
			campaignId: body.campaignId ?? null,
			name: String(body.name ?? body.contactId),
			email: String(body.email ?? ""),
			phone: String(body.phone ?? body.contactId),
			now,
		});

		return reply.send({
			...result,
		});
	});

	fastify.get("/api/sdr/leads/:id", async (request, reply) => {
		const params = request.params as any;
		const id = String(params.id);

		const lead = await prisma.lead.findUnique({ where: { id } });
		if (!lead) {
			return reply.code(404).send({ error: "LEAD_NOT_FOUND" });
		}

		const conversations = await prisma.conversation.findMany({
			where: { leadId: id },
			orderBy: { lastMessageAt: "desc" },
		});

		const now = new Date();
		const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const decisions = await options.gateDecisions.list({
			since,
			until: now,
			tenantId: lead.tenantId,
		});

		return reply.send({
			lead,
			conversations,
			gateDecisions: decisions,
		});
	});
};


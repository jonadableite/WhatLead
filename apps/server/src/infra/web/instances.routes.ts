import prisma from "@WhatLead/db";
import type { FastifyInstance } from "fastify";

import { auth } from "@WhatLead/auth";
import type { ConnectInstanceUseCase } from "../../application/instances/connect-instance.use-case";
import type { CreateInstanceUseCase } from "../../application/instances/create-instance.use-case";
import type { EvaluateInstanceHealthOnDemandUseCase } from "../../application/instances/evaluate-instance-health-on-demand.use-case";
import type { GetInstanceConnectionStatusUseCase } from "../../application/instances/get-instance-connection-status.use-case";
import type { GetInstanceQRCodeUseCase } from "../../application/instances/get-instance-qrcode.use-case";
import type { GetInstanceUseCase } from "../../application/instances/get-instance.use-case";
import type { ListInstancesUseCase } from "../../application/instances/list-instances.use-case";
import type { InstancePurpose } from "../../domain/value-objects/instance-purpose";
import type { WhatsAppEngine } from "../../domain/value-objects/whatsapp-engine";

interface CreateInstanceBody {
	displayName: string;
	phoneNumber: string;
	purpose: InstancePurpose;
	engine: WhatsAppEngine;
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

export const registerInstanceRoutes = async (
	fastify: FastifyInstance,
	options: {
		listInstances: ListInstancesUseCase;
		createInstance: CreateInstanceUseCase;
		getInstance: GetInstanceUseCase;
		connectInstance: ConnectInstanceUseCase;
		getConnectionStatus: GetInstanceConnectionStatusUseCase;
		getQRCode: GetInstanceQRCodeUseCase;
		evaluateHealthOnDemand: EvaluateInstanceHealthOnDemandUseCase;
	},
): Promise<void> => {
	fastify.get("/api/instances/gate", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const result = await options.listInstances.execute({ companyId: tenantId });
		if (!result.items.length) {
			return reply.send({
				state: "NO_INSTANCE",
				message: "Crie uma instância para ativar o resto da plataforma.",
				recommendedAction: "CREATE_INSTANCE",
			});
		}

		const isReady = result.items.some(
			(i) =>
				i.allowedActions.includes("ALLOW_DISPATCH") ||
				i.healthLabel === "Apta para aquecer",
		);

		if (!isReady) {
			return reply.send({
				state: "NOT_HEALTHY",
				message:
					"Nenhuma instância está apta. Ajuste conexão/saúde para liberar operação.",
				recommendedAction: "OPEN_INSTANCES",
			});
		}

		return reply.send({ state: "READY" });
	});

	fastify.get("/api/instances", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const result = await options.listInstances.execute({ companyId: tenantId });
		return reply.send(result);
	});

	fastify.post("/api/instances", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const body = request.body as CreateInstanceBody;
		const displayName = String(body?.displayName ?? "").trim();
		const phoneNumber = String(body?.phoneNumber ?? "").trim();
		const purpose = body?.purpose;
		const engine = body?.engine;

		if (!displayName) return reply.status(400).send({ message: "displayName é obrigatório" });
		if (!phoneNumber) return reply.status(400).send({ message: "phoneNumber é obrigatório" });
		if (!purpose) return reply.status(400).send({ message: "purpose é obrigatório" });
		if (!engine) return reply.status(400).send({ message: "engine é obrigatório" });

		const result = await options.createInstance.execute({
			companyId: tenantId,
			displayName,
			phoneNumber,
			purpose,
			engine,
		});

		return reply.status(201).send(result);
	});

	fastify.get("/api/instances/:id", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.getInstance.execute({
				companyId: tenantId,
				instanceId: params.id,
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });
		}
	});

	fastify.post("/api/instances/:id/connect", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.connectInstance.execute({
				companyId: tenantId,
				instanceId: params.id,
				intent: "CONNECT",
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });
		}
	});

	fastify.post("/api/instances/:id/reconnect", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.connectInstance.execute({
				companyId: tenantId,
				instanceId: params.id,
				intent: "RECONNECT",
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });
		}
	});

	fastify.get("/api/instances/:id/connection-status", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.getConnectionStatus.execute({
				companyId: tenantId,
				instanceId: params.id,
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });
		}
	});

	fastify.get("/api/instances/:id/qrcode", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.getQRCode.execute({
				companyId: tenantId,
				instanceId: params.id,
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });
		}
	});

	fastify.get("/api/instances/:id/health", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.evaluateHealthOnDemand.execute({
				companyId: tenantId,
				instanceId: params.id,
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });
		}
	});

	fastify.post("/api/instances/:id/health/evaluate", async (request, reply) => {
		const tenantId = await resolveTenantId(request.headers as any);
		if (!tenantId) return reply.status(401).send({ error: "UNAUTHORIZED" });

		const params = request.params as { id: string };
		try {
			const result = await options.evaluateHealthOnDemand.execute({
				companyId: tenantId,
				instanceId: params.id,
			});
			return reply.send(result);
		} catch {
			return reply.status(404).send({ error: "INSTANCE_NOT_FOUND" });
		}
	});
};

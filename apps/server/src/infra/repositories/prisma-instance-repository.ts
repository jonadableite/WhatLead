import prisma from "@WhatLead/db";
import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { InstanceReputationRepository } from "../../domain/repositories/instance-reputation-repository";

export class PrismaInstanceRepository implements InstanceRepository {
	constructor(
		private readonly reputations: InstanceReputationRepository,
	) {}

	private async loadReputation(instanceId: string): Promise<InstanceReputation> {
		const existing = await this.reputations.findByInstanceId(instanceId);
		if (existing) return existing;
		return InstanceReputation.initialize(instanceId);
	}

	async create(instance: Instance): Promise<void> {
		await prisma.instance.create({
			data: {
				id: instance.id,
				tenantId: instance.companyId,
				displayName: instance.displayName,
				phoneNumber: instance.phoneNumber,
				purpose: instance.purpose,
				engine: instance.engine,
				lifecycleStatus: instance.lifecycleStatus,
				connectionStatus: instance.connectionStatus,
				createdAt: instance.createdAt,
				lastConnectedAt: instance.lastConnectedAt,
			},
		});
	}

	async findById(instanceId: string): Promise<Instance | null> {
		const row = await prisma.instance.findUnique({ where: { id: instanceId } });
		if (!row) return null;

		const reputation = await this.loadReputation(row.id);

		return Instance.reconstitute({
			id: row.id,
			companyId: row.tenantId,
			engine: row.engine as any,
			purpose: row.purpose as any,
			displayName: row.displayName,
			phoneNumber: row.phoneNumber,
			lifecycleStatus: row.lifecycleStatus as any,
			connectionStatus: row.connectionStatus as any,
			reputation,
			activeCampaignIds: [],
			createdAt: row.createdAt,
			lastConnectedAt: row.lastConnectedAt,
		});
	}

	async listByCompanyId(companyId: string): Promise<Instance[]> {
		const rows = await prisma.instance.findMany({
			where: { tenantId: companyId },
			orderBy: { createdAt: "desc" },
		});

		const instances = await Promise.all(
			rows.map(async (row) => {
				const reputation = await this.loadReputation(row.id);
				return Instance.reconstitute({
					id: row.id,
					companyId: row.tenantId,
					engine: row.engine as any,
					purpose: row.purpose as any,
					displayName: row.displayName,
					phoneNumber: row.phoneNumber,
					lifecycleStatus: row.lifecycleStatus as any,
					connectionStatus: row.connectionStatus as any,
					reputation,
					activeCampaignIds: [],
					createdAt: row.createdAt,
					lastConnectedAt: row.lastConnectedAt,
				});
			}),
		);

		return instances;
	}

	async save(instance: Instance): Promise<void> {
		await prisma.instance.upsert({
			where: { id: instance.id },
			create: {
				id: instance.id,
				tenantId: instance.companyId,
				displayName: instance.displayName,
				phoneNumber: instance.phoneNumber,
				purpose: instance.purpose,
				engine: instance.engine,
				lifecycleStatus: instance.lifecycleStatus,
				connectionStatus: instance.connectionStatus,
				createdAt: instance.createdAt,
				lastConnectedAt: instance.lastConnectedAt,
			},
			update: {
				displayName: instance.displayName,
				phoneNumber: instance.phoneNumber,
				purpose: instance.purpose,
				lifecycleStatus: instance.lifecycleStatus,
				connectionStatus: instance.connectionStatus,
				lastConnectedAt: instance.lastConnectedAt,
			},
		});
	}
}


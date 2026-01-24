import prisma from "@WhatLead/db";

import type {
	OperationalEventRecord,
	OperationalEventRepository,
} from "../../domain/repositories/operational-event-repository";

export class PrismaOperationalEventRepository implements OperationalEventRepository {
	async appendMany(records: OperationalEventRecord[]): Promise<void> {
		if (records.length === 0) return;
		await prisma.operationalEvent.createMany({
			data: records.map((r) => ({
				id: r.id,
				organizationId: r.organizationId,
				aggregateType: r.aggregateType,
				aggregateId: r.aggregateId,
				eventType: r.eventType,
				payload: r.payload as any,
				occurredAt: r.occurredAt,
				createdAt: r.createdAt,
			})),
		});
	}

	async listByAggregate(params: {
		organizationId?: string;
		aggregateType: string;
		aggregateId: string;
		limit: number;
	}): Promise<OperationalEventRecord[]> {
		const rows = await prisma.operationalEvent.findMany({
			where: {
				aggregateType: params.aggregateType,
				aggregateId: params.aggregateId,
				...(params.organizationId ? { organizationId: params.organizationId } : {}),
			},
			orderBy: { occurredAt: "asc" },
			take: params.limit,
		});

		return rows.map((r) => ({
			id: r.id,
			organizationId: r.organizationId,
			aggregateType: r.aggregateType,
			aggregateId: r.aggregateId,
			eventType: r.eventType,
			payload: r.payload as any,
			occurredAt: r.occurredAt,
			createdAt: r.createdAt,
		}));
	}
}


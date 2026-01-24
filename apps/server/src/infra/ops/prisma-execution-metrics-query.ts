import prisma from "@WhatLead/db";

import type {
	ExecutionMetricsQueryPort,
	ExecutionMetricsSnapshot,
	InstanceExecutionMetrics,
} from "../../application/ops/execution-metrics-query-port";

export class PrismaExecutionMetricsQuery implements ExecutionMetricsQueryPort {
	async getMetrics(params: {
		windowMinutes: number;
		now: Date;
		organizationId?: string;
		instanceId?: string;
	}): Promise<ExecutionMetricsSnapshot> {
		const since = new Date(params.now.getTime() - params.windowMinutes * 60 * 1000);

		const where: any = { createdAt: { gte: since, lte: params.now } };
		if (params.organizationId) {
			const instances = await prisma.instance.findMany({
				where: { tenantId: params.organizationId },
				select: { id: true },
			});
			const instanceIds = instances.map((i) => i.id);
			if (instanceIds.length === 0) {
				return {
					windowMinutes: params.windowMinutes,
					since,
					now: params.now,
					totals: { jobsCreated: 0, messagesSent: 0, failedJobs: 0, retries: 0 },
					byInstance: [],
				};
			}
			where.instanceId = { in: instanceIds };
		}
		if (params.instanceId) where.instanceId = params.instanceId;

		const jobsCreated = await prisma.messageExecutionJob.groupBy({
			by: ["instanceId"],
			where,
			_count: { _all: true },
		});

		const sent = await prisma.messageExecutionJob.groupBy({
			by: ["instanceId"],
			where: {
				...where,
				status: "SENT",
				executedAt: { gte: since, lte: params.now },
			},
			_count: { _all: true },
		});

		const failed = await prisma.messageExecutionJob.groupBy({
			by: ["instanceId"],
			where: {
				...where,
				status: "FAILED",
			},
			_count: { _all: true },
		});

		const retryRows = await prisma.messageExecutionJob.findMany({
			where,
			select: { instanceId: true, attempts: true },
		});

		const retriesByInstance = new Map<string, number>();
		for (const row of retryRows) {
			const retries = Math.max(0, (row.attempts ?? 0) - 1);
			if (retries === 0) continue;
			retriesByInstance.set(
				row.instanceId,
				(retriesByInstance.get(row.instanceId) ?? 0) + retries,
			);
		}

		const executed = await prisma.messageExecutionJob.findMany({
			where: {
				...(params.organizationId ? { instanceId: where.instanceId } : {}),
				...(params.instanceId ? { instanceId: params.instanceId } : {}),
				status: "SENT",
				executedAt: { gte: since, lte: params.now },
			},
			select: { instanceId: true, executedAt: true },
			orderBy: [{ instanceId: "asc" }, { executedAt: "asc" }],
			take: 1000,
		});

		const avgIntervalSecondsByInstance = computeAvgIntervals(executed);

		const allInstanceIds = new Set<string>();
		for (const r of jobsCreated) allInstanceIds.add(r.instanceId);
		for (const r of sent) allInstanceIds.add(r.instanceId);
		for (const r of failed) allInstanceIds.add(r.instanceId);
		for (const k of retriesByInstance.keys()) allInstanceIds.add(k);

		const toMap = (rows: { instanceId: string; _count: { _all: number } }[]) =>
			new Map(rows.map((r) => [r.instanceId, r._count._all]));

		const jobsCreatedMap = toMap(jobsCreated);
		const sentMap = toMap(sent);
		const failedMap = toMap(failed);

		const byInstance: InstanceExecutionMetrics[] = [...allInstanceIds].map((instanceId) => ({
			instanceId,
			jobsCreated: jobsCreatedMap.get(instanceId) ?? 0,
			messagesSent: sentMap.get(instanceId) ?? 0,
			failedJobs: failedMap.get(instanceId) ?? 0,
			retries: retriesByInstance.get(instanceId) ?? 0,
			avgIntervalSeconds: avgIntervalSecondsByInstance.get(instanceId) ?? null,
		}));

		const totals = byInstance.reduce(
			(acc, cur) => ({
				jobsCreated: acc.jobsCreated + cur.jobsCreated,
				messagesSent: acc.messagesSent + cur.messagesSent,
				failedJobs: acc.failedJobs + cur.failedJobs,
				retries: acc.retries + cur.retries,
			}),
			{ jobsCreated: 0, messagesSent: 0, failedJobs: 0, retries: 0 },
		);

		return {
			windowMinutes: params.windowMinutes,
			since,
			now: params.now,
			totals,
			byInstance,
		};
	}
}

const computeAvgIntervals = (
	rows: { instanceId: string; executedAt: Date | null }[],
): Map<string, number> => {
	const map = new Map<string, Date[]>();
	for (const row of rows) {
		if (!row.executedAt) continue;
		const list = map.get(row.instanceId) ?? [];
		list.push(row.executedAt);
		map.set(row.instanceId, list);
	}

	const out = new Map<string, number>();
	for (const [instanceId, times] of map) {
		if (times.length < 2) continue;
		let total = 0;
		for (let i = 1; i < times.length; i++) {
			total += (times[i]!.getTime() - times[i - 1]!.getTime()) / 1000;
		}
		out.set(instanceId, total / (times.length - 1));
	}
	return out;
};

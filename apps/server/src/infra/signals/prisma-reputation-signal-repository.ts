import prisma from "@WhatLead/db";
import type { ReputationSignalRepository } from "../../domain/repositories/reputation-signal-repository";
import type { ReputationSignal } from "../../domain/value-objects/reputation-signal";

export class PrismaReputationSignalRepository
	implements ReputationSignalRepository
{
	constructor(private readonly retentionDays: number = 7) {}

	async append(signal: ReputationSignal): Promise<void> {
		await prisma.reputationSignal.create({
			data: {
				instanceId: signal.instanceId,
				occurredAt: signal.occurredAt,
				type: signal.type,
				messageId: signal.messageId,
				remoteJid: signal.remoteJid,
				isGroup: signal.isGroup ?? false,
				latencyMs:
					typeof signal.latencyMs === "number"
						? Math.round(signal.latencyMs)
						: undefined,
			},
		});
	}

	async getWindow(params: {
		instanceId: string;
		since: Date;
		until: Date;
	}): Promise<readonly ReputationSignal[]> {
		const rows = await prisma.reputationSignal.findMany({
			where: {
				instanceId: params.instanceId,
				occurredAt: {
					gte: params.since,
					lte: params.until,
				},
			},
			orderBy: { occurredAt: "asc" },
		});

		return rows.map((row) => ({
			type: row.type as ReputationSignal["type"],
			instanceId: row.instanceId,
			occurredAt: row.occurredAt,
			messageId: row.messageId ?? undefined,
			remoteJid: row.remoteJid ?? undefined,
			isGroup: row.isGroup,
			latencyMs: row.latencyMs ?? undefined,
		}));
	}

	async pruneOldSignals(now: Date = new Date()): Promise<number> {
		const cutoff = new Date(now.getTime() - this.retentionDays * 24 * 60 * 60 * 1000);
		const result = await prisma.reputationSignal.deleteMany({
			where: {
				occurredAt: {
					lt: cutoff,
				},
			},
		});
		return result.count;
	}
}


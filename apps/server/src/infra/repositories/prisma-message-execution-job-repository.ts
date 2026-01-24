import prisma from "@WhatLead/db";

import { MessageExecutionJob } from "../../domain/entities/message-execution-job";
import type { MessageExecutionJobRepository } from "../../domain/repositories/message-execution-job-repository";

export class PrismaMessageExecutionJobRepository implements MessageExecutionJobRepository {
	async create(job: MessageExecutionJob): Promise<void> {
		await prisma.messageExecutionJob.create({
			data: {
				id: job.id,
				intentId: job.intentId,
				instanceId: job.instanceId,
				provider: job.provider,
				status: job.status,
				attempts: job.attempts,
				lastError: job.lastError,
				createdAt: job.createdAt,
				executedAt: job.executedAt,
				nextAttemptAt: job.nextAttemptAt,
			},
		});
	}

	async findById(jobId: string): Promise<MessageExecutionJob | null> {
		const row = await prisma.messageExecutionJob.findUnique({ where: { id: jobId } });
		if (!row) return null;
		return MessageExecutionJob.reconstitute({
			id: row.id,
			intentId: row.intentId,
			instanceId: row.instanceId,
			provider: row.provider,
			status: row.status as any,
			attempts: row.attempts,
			lastError: row.lastError,
			createdAt: row.createdAt,
			executedAt: row.executedAt,
			nextAttemptAt: (row as any).nextAttemptAt ?? null,
		});
	}

	async findByIntentId(intentId: string): Promise<MessageExecutionJob | null> {
		const row = await prisma.messageExecutionJob.findUnique({ where: { intentId } });
		if (!row) return null;
		return MessageExecutionJob.reconstitute({
			id: row.id,
			intentId: row.intentId,
			instanceId: row.instanceId,
			provider: row.provider,
			status: row.status as any,
			attempts: row.attempts,
			lastError: row.lastError,
			createdAt: row.createdAt,
			executedAt: row.executedAt,
			nextAttemptAt: (row as any).nextAttemptAt ?? null,
		});
	}

	async save(job: MessageExecutionJob): Promise<void> {
		await prisma.messageExecutionJob.update({
			where: { id: job.id },
			data: {
				status: job.status,
				attempts: job.attempts,
				lastError: job.lastError,
				executedAt: job.executedAt,
				nextAttemptAt: job.nextAttemptAt,
			},
		});
	}

	async listRunnable(now: Date, limit: number): Promise<MessageExecutionJob[]> {
		const rows = await prisma.messageExecutionJob.findMany({
			where: {
				status: { in: ["PENDING", "RETRY"] },
				OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
			},
			orderBy: { createdAt: "asc" },
			take: limit,
		});

		return rows.map((row) =>
			MessageExecutionJob.reconstitute({
				id: row.id,
				intentId: row.intentId,
				instanceId: row.instanceId,
				provider: row.provider,
				status: row.status as any,
				attempts: row.attempts,
				lastError: row.lastError,
				createdAt: row.createdAt,
				executedAt: row.executedAt,
				nextAttemptAt: (row as any).nextAttemptAt ?? null,
			}),
		);
	}

	async tryClaim(jobId: string, now: Date): Promise<MessageExecutionJob | null> {
		const updated = await prisma.messageExecutionJob.updateMany({
			where: {
				id: jobId,
				status: { in: ["PENDING", "RETRY"] },
				OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
			},
			data: {
				status: "PROCESSING",
				attempts: { increment: 1 },
				lastError: null,
				executedAt: null,
				nextAttemptAt: null,
			},
		});

		if (updated.count === 0) return null;
		return this.findById(jobId);
	}
}

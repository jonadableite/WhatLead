import prisma from "@WhatLead/db";
import { ConversationExecutionJob } from "../../domain/entities/conversation-execution-job";
import type { ConversationExecutionJobRepository } from "../../domain/repositories/conversation-execution-job-repository";
import type { ExecutionJobStatus } from "../../domain/value-objects/execution-job-status";
import type { ExecutionJobType } from "../../domain/value-objects/execution-job-type";

export class PrismaConversationExecutionJobRepository
	implements ConversationExecutionJobRepository
{
	async findById(id: string): Promise<ConversationExecutionJob | null> {
		const row = await prisma.conversationExecutionJob.findUnique({
			where: { id },
		});
		if (!row) {
			return null;
		}
		return this.toDomain(row);
	}

	async findByUniqueKey(params: {
		conversationId: string;
		triggerEventId: string;
		type: ExecutionJobType;
	}): Promise<ConversationExecutionJob | null> {
		const row = await prisma.conversationExecutionJob.findUnique({
			where: {
				conversationId_triggerEventId_type: {
					conversationId: params.conversationId,
					triggerEventId: params.triggerEventId,
					type: params.type,
				},
			},
		});
		if (!row) {
			return null;
		}
		return this.toDomain(row);
	}

	async save(job: ConversationExecutionJob): Promise<void> {
		await prisma.conversationExecutionJob.upsert({
			where: { id: job.id },
			create: {
				id: job.id,
				conversationId: job.conversationId,
				triggerEventId: job.triggerEventId,
				type: job.type,
				status: job.status,
				payload: job.payload as any,
				scheduledFor: job.scheduledFor,
				attempts: job.attempts,
				maxAttempts: job.maxAttempts,
				lastError: job.lastError,
				createdAt: job.createdAt,
				executedAt: job.executedAt,
				failedAt: job.failedAt,
				cancelledAt: job.cancelledAt,
			},
			update: {
				status: job.status,
				attempts: job.attempts,
				lastError: job.lastError,
				executedAt: job.executedAt,
				failedAt: job.failedAt,
				cancelledAt: job.cancelledAt,
			},
		});
	}

	async findRunnableJobs(params: {
		limit: number;
		now?: Date;
	}): Promise<ConversationExecutionJob[]> {
		const now = params.now ?? new Date();
		const rows = await prisma.conversationExecutionJob.findMany({
			where: {
				status: "PENDING",
				scheduledFor: { lte: now },
			},
			orderBy: { scheduledFor: "asc" },
			take: params.limit,
		});
		return rows.map((row) => this.toDomain(row));
	}

	async findByConversation(params: {
		conversationId: string;
		status?: ExecutionJobStatus;
		limit?: number;
	}): Promise<ConversationExecutionJob[]> {
		const rows = await prisma.conversationExecutionJob.findMany({
			where: {
				conversationId: params.conversationId,
				...(params.status ? { status: params.status } : {}),
			},
			orderBy: { createdAt: "desc" },
			take: params.limit ?? 50,
		});
		return rows.map((row) => this.toDomain(row));
	}

	async claimJob(jobId: string): Promise<boolean> {
		const result = await prisma.conversationExecutionJob.updateMany({
			where: {
				id: jobId,
				status: "PENDING",
			},
			data: {
				status: "RUNNING",
				attempts: { increment: 1 },
			},
		});
		return result.count > 0;
	}

	private toDomain(row: {
		id: string;
		conversationId: string;
		triggerEventId: string;
		type: string;
		status: string;
		payload: unknown;
		scheduledFor: Date;
		attempts: number;
		maxAttempts: number;
		lastError: string | null;
		createdAt: Date;
		executedAt: Date | null;
		failedAt: Date | null;
		cancelledAt: Date | null;
	}): ConversationExecutionJob {
		return ConversationExecutionJob.reconstitute({
			id: row.id,
			conversationId: row.conversationId,
			triggerEventId: row.triggerEventId,
			type: row.type as ExecutionJobType,
			status: row.status as ExecutionJobStatus,
			payload: (row.payload as Record<string, unknown>) ?? null,
			scheduledFor: row.scheduledFor,
			attempts: row.attempts,
			maxAttempts: row.maxAttempts,
			lastError: row.lastError,
			createdAt: row.createdAt,
			executedAt: row.executedAt,
			failedAt: row.failedAt,
			cancelledAt: row.cancelledAt,
		});
	}
}

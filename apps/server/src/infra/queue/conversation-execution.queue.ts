import { Queue } from "bullmq";

import { env } from "@WhatLead/env/server";

import type {
	ConversationExecutionQueue,
	ConversationExecutionQueueJob,
} from "../../application/execution-engine/ports/conversation-execution-queue";
import type { ExecutionJobType } from "../../domain/value-objects/execution-job-type";

const QUEUE_NAME_PREFIX = "conversation-execution";

const QUEUE_CONFIG: Record<ExecutionJobType, { queueName: string; attempts: number; backoffMs: number }> = {
	WARMUP_CHECK: {
		queueName: `${QUEUE_NAME_PREFIX}:critical`,
		attempts: 1,
		backoffMs: 1000,
	},
	SLA_TIMEOUT: {
		queueName: `${QUEUE_NAME_PREFIX}:standard`,
		attempts: 1,
		backoffMs: 5000,
	},
	ASSIGNMENT_EVALUATION: {
		queueName: `${QUEUE_NAME_PREFIX}:standard`,
		attempts: 3,
		backoffMs: 5000,
	},
	AUTO_CLOSE_CONVERSATION: {
		queueName: `${QUEUE_NAME_PREFIX}:delayed`,
		attempts: 1,
		backoffMs: 10000,
	},
	WEBHOOK_DISPATCH: {
		queueName: `${QUEUE_NAME_PREFIX}:standard`,
		attempts: 5,
		backoffMs: 5000,
	},
};

export class BullMQConversationExecutionQueue implements ConversationExecutionQueue {
	private readonly queues: Map<string, Queue> = new Map();

	constructor() {
		// Initialize all queues
		const uniqueQueueNames = new Set(Object.values(QUEUE_CONFIG).map((c) => c.queueName));
		for (const queueName of uniqueQueueNames) {
			this.queues.set(
				queueName,
				new Queue(queueName, {
					connection: { url: env.REDIS_URL },
				}),
			);
		}
	}

	async enqueue(job: ConversationExecutionQueueJob): Promise<void> {
		const config = QUEUE_CONFIG[job.type];
		const queue = this.queues.get(config.queueName);

		if (!queue) {
			throw new Error(`Queue not found for job type: ${job.type}`);
		}

		const delay = Math.max(0, job.scheduledAt.getTime() - Date.now());

		await queue.add(
			`execute-${job.type.toLowerCase()}`,
			{ jobId: job.jobId, type: job.type },
			{
				delay,
				attempts: config.attempts,
				backoff: { type: "exponential", delay: config.backoffMs },
				jobId: job.jobId, // Use job ID as BullMQ job ID for idempotency
			},
		);
	}

	getQueueNames(): string[] {
		return Array.from(this.queues.keys());
	}
}

import { Queue } from "bullmq";

import { env } from "@WhatLead/env/server";

import type {
	ExecutionQueue,
	ExecutionQueueJob,
} from "../../application/execution/ports/execution-queue";

const EXECUTION_QUEUE_NAME = "execution";
const EXECUTION_JOB_NAME = "execute-message";
const DEFAULT_ATTEMPTS = 5;
const DEFAULT_BACKOFF_MS = 5_000;

export class BullMQExecutionQueue implements ExecutionQueue {
	private readonly queue: Queue;

	constructor() {
		this.queue = new Queue(EXECUTION_QUEUE_NAME, {
			connection: { url: env.REDIS_URL },
		});
	}

	async enqueue(job: ExecutionQueueJob): Promise<void> {
		const delay = Math.max(0, job.scheduledAt.getTime() - Date.now());
		await this.queue.add(
			EXECUTION_JOB_NAME,
			{ jobId: job.jobId },
			{
				delay,
				attempts: DEFAULT_ATTEMPTS,
				backoff: { type: "exponential", delay: DEFAULT_BACKOFF_MS },
			},
		);
	}
}

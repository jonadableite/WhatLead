import { Worker } from "bullmq";

import { env } from "@WhatLead/env/server";

import type { JobDispatcher } from "../../application/execution-engine/job-dispatcher";
import type { ConversationExecutionQueue } from "../../application/execution-engine/ports/conversation-execution-queue";
import type { ExecutionJobType } from "../../domain/value-objects/execution-job-type";

const QUEUE_NAME_PREFIX = "conversation-execution";
const QUEUE_NAMES = [
	`${QUEUE_NAME_PREFIX}:critical`,
	`${QUEUE_NAME_PREFIX}:standard`,
	`${QUEUE_NAME_PREFIX}:delayed`,
];

const DEFAULT_RETRY_DELAY_MS = 5_000;

export class ConversationExecutionWorker {
	private workers: Worker[] = [];

	constructor(
		private readonly dispatcher: JobDispatcher,
		private readonly queue: ConversationExecutionQueue | null,
	) {}

	start(): void {
		if (this.workers.length > 0) return;

		for (const queueName of QUEUE_NAMES) {
			const worker = new Worker(
				queueName,
				async (job) => {
					const jobId = job.data.jobId as string;
					const type = job.data.type as ExecutionJobType;

					const result = await this.dispatcher.dispatch(jobId);

					if (!result.success) {
						// Log error but don't throw for non-retriable cases
						console.error(
							`[ConversationExecutionWorker] Job ${jobId} (${type}) failed: ${result.error}`,
						);

						// BullMQ will handle retries based on job config
						if (result.error && !result.error.includes("already claimed")) {
							throw new Error(result.error);
						}
					}
				},
				{
					connection: { url: env.REDIS_URL },
					concurrency: queueName.includes("critical") ? 10 : 5,
				},
			);

			worker.on("failed", (job, err) => {
				console.error(
					`[ConversationExecutionWorker] Job ${job?.data?.jobId} failed permanently:`,
					err.message,
				);
			});

			worker.on("completed", (job) => {
				console.log(
					`[ConversationExecutionWorker] Job ${job.data.jobId} (${job.data.type}) completed`,
				);
			});

			this.workers.push(worker);
		}
	}

	async stop(): Promise<void> {
		await Promise.all(this.workers.map((w) => w.close()));
		this.workers = [];
	}
}

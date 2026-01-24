import { Worker } from "bullmq";

import { env } from "@WhatLead/env/server";

import type { ExecutionQueue } from "../../application/execution/ports/execution-queue";
import { ExecuteMessageIntentUseCase } from "../../application/message-execution/execute-message-intent.use-case";
import type { RetryFailedExecutionUseCase } from "../../application/message-execution/retry-failed-execution.use-case";

const EXECUTION_QUEUE_NAME = "execution";
const DEFAULT_RETRY_DELAY_MS = 5_000;
const OPS_PAUSED_DELAY_MS = 60_000;

export class ExecutionWorker {
	private worker: Worker | null = null;

	constructor(
		private readonly executeMessage: ExecuteMessageIntentUseCase,
		private readonly retryFailed: RetryFailedExecutionUseCase,
		private readonly queue: ExecutionQueue,
	) {}

	start(): void {
		if (this.worker) return;
		this.worker = new Worker(
			EXECUTION_QUEUE_NAME,
			async (job) => {
				const now = new Date();
				const result = await this.executeMessage.execute({
					jobId: job.data.jobId as string,
					now,
				});

				if (result.status === "FAILED" && result.willRetry) {
					const delay =
						result.error === "OPS_PAUSED" ? OPS_PAUSED_DELAY_MS : DEFAULT_RETRY_DELAY_MS;
					const nextAttemptAt = new Date(now.getTime() + delay);
					await this.retryFailed.execute({
						jobId: job.data.jobId as string,
						maxAttempts: ExecuteMessageIntentUseCase.DEFAULT_MAX_ATTEMPTS,
						now,
						nextAttemptAt,
					});
					await this.queue.enqueue({
						jobId: job.data.jobId as string,
						scheduledAt: nextAttemptAt,
					});
				}

				if (result.status === "FAILED" && !result.willRetry) {
					throw new Error(result.error);
				}
			},
			{
				connection: { url: env.REDIS_URL },
			},
		);
	}

	async stop(): Promise<void> {
		if (!this.worker) return;
		await this.worker.close();
		this.worker = null;
	}
}

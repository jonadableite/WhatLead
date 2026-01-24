import type { CreateExecutionJobUseCase } from "../../message-execution/create-execution-job.use-case";
import type { ExecuteMessageIntentUseCase } from "../../message-execution/execute-message-intent.use-case";
import type { RetryFailedExecutionUseCase } from "../../message-execution/retry-failed-execution.use-case";
import type { MessageExecutionJobRepository } from "../../../domain/repositories/message-execution-job-repository";
import type { MessageIntentRepository } from "../../../domain/repositories/message-intent-repository";

export class MessageExecutorWorker {
	constructor(
		private readonly intents: MessageIntentRepository,
		private readonly jobs: MessageExecutionJobRepository,
		private readonly createJob: CreateExecutionJobUseCase,
		private readonly executeJob: ExecuteMessageIntentUseCase,
		private readonly retryFailed: RetryFailedExecutionUseCase,
		private readonly options: {
			approvedScanLimit: number;
			jobScanLimit: number;
			maxAttempts: number;
		},
	) {}

	async run(now: Date = new Date()): Promise<void> {
		const approved = await this.intents.listApproved(this.options.approvedScanLimit);
		for (const intent of approved) {
			try {
				await this.createJob.execute({
					intentId: intent.id,
					organizationId: intent.organizationId,
					now,
				});
			} catch {
				continue;
			}
		}

		const runnable = await this.jobs.listRunnable(now, this.options.jobScanLimit);
		for (const job of runnable) {
			const out = await this.executeJob.execute({ jobId: job.id, now });
			if (out.status === "FAILED" && out.willRetry) {
				const nextAttemptAt =
					out.error === "OPS_PAUSED" ? new Date(now.getTime() + 60 * 1000) : undefined;
				await this.retryFailed.execute({
					jobId: job.id,
					maxAttempts: this.options.maxAttempts,
					now,
					nextAttemptAt,
				});
			}
		}
	}
}

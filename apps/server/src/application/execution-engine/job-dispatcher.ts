import type { ConversationExecutionJob } from "../../domain/entities/conversation-execution-job";
import type { ConversationExecutionJobRepository } from "../../domain/repositories/conversation-execution-job-repository";
import type { ExecutionJobType } from "../../domain/value-objects/execution-job-type";
import type { AssignmentEvaluationWorker } from "./workers/assignment-evaluation.worker";
import type { AutoCloseWorker } from "./workers/auto-close.worker";
import type { SlaTimeoutWorker } from "./workers/sla-timeout.worker";
import type { WarmupCheckWorker } from "./workers/warmup-check.worker";
import type { WebhookDispatchWorker } from "./workers/webhook-dispatch.worker";

export interface JobDispatcherWorkers {
	warmupCheck: WarmupCheckWorker;
	slaTimeout: SlaTimeoutWorker;
	assignmentEvaluation: AssignmentEvaluationWorker;
	autoClose: AutoCloseWorker;
	webhookDispatch: WebhookDispatchWorker;
}

export interface JobDispatchResult {
	success: boolean;
	error?: string;
}

export class JobDispatcher {
	constructor(
		private readonly jobRepository: ConversationExecutionJobRepository,
		private readonly workers: JobDispatcherWorkers,
	) {}

	async dispatch(jobId: string): Promise<JobDispatchResult> {
		// Claim the job atomically
		const claimed = await this.jobRepository.claimJob(jobId);
		if (!claimed) {
			return { success: false, error: "Job already claimed or not pending" };
		}

		// Fetch the job after claiming
		const job = await this.jobRepository.findById(jobId);
		if (!job) {
			return { success: false, error: "Job not found" };
		}

		return this.executeJob(job);
	}

	private async executeJob(job: ConversationExecutionJob): Promise<JobDispatchResult> {
		const type = job.type;

		try {
			switch (type) {
				case "WARMUP_CHECK": {
					const result = await this.workers.warmupCheck.execute(job);
					return { success: result.success, error: result.error };
				}
				case "SLA_TIMEOUT": {
					const result = await this.workers.slaTimeout.execute(job);
					return { success: result.success, error: result.error };
				}
				case "ASSIGNMENT_EVALUATION": {
					const result = await this.workers.assignmentEvaluation.execute(job);
					return { success: result.success, error: result.error };
				}
				case "AUTO_CLOSE_CONVERSATION": {
					const result = await this.workers.autoClose.execute(job);
					return { success: result.success, error: result.error };
				}
				case "WEBHOOK_DISPATCH": {
					const result = await this.workers.webhookDispatch.execute(job);
					return { success: result.success, error: result.error };
				}
				default: {
					const exhaustiveCheck: never = type;
					return { success: false, error: `Unknown job type: ${exhaustiveCheck}` };
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			job.fail(errorMessage);
			await this.jobRepository.save(job);
			return { success: false, error: errorMessage };
		}
	}
}

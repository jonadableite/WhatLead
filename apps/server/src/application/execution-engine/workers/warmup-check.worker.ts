import type { ConversationExecutionJob } from "../../../domain/entities/conversation-execution-job";
import type { ConversationExecutionJobRepository } from "../../../domain/repositories/conversation-execution-job-repository";
import type { ConversationRepository } from "../../../domain/repositories/conversation-repository";
import type { InstanceRepository } from "../../../domain/repositories/instance-repository";

export interface WarmupCheckWorkerResult {
	success: boolean;
	warmupNeeded: boolean;
	error?: string;
}

export class WarmupCheckWorker {
	constructor(
		private readonly jobRepository: ConversationExecutionJobRepository,
		private readonly conversationRepository: ConversationRepository,
		private readonly instanceRepository: InstanceRepository,
	) {}

	async execute(job: ConversationExecutionJob): Promise<WarmupCheckWorkerResult> {
		// Idempotency check
		if (job.status !== "RUNNING") {
			return { success: false, warmupNeeded: false, error: "Job not in RUNNING state" };
		}

		try {
			const conversation = await this.conversationRepository.findById({
				id: job.conversationId,
			});

			if (!conversation) {
				job.complete();
				await this.jobRepository.save(job);
				return { success: true, warmupNeeded: false };
			}

			const instance = await this.instanceRepository.findById(conversation.instanceId);

			if (!instance) {
				job.complete();
				await this.jobRepository.save(job);
				return { success: true, warmupNeeded: false };
			}

			// Check if instance needs warmup based on lifecycle status
			const needsWarmup =
				instance.lifecycleStatus === "WARMING" ||
				instance.lifecycleStatus === "COOLING";

			if (needsWarmup) {
				// Emit system event for warmup needed
				await this.conversationRepository.saveEvent({
					conversationId: conversation.id,
					type: "SYSTEM",
					action: "CONVERSATION_OPENED", // Using existing action, could extend later
					createdAt: new Date(),
				});
			}

			job.complete();
			await this.jobRepository.save(job);

			return { success: true, warmupNeeded: needsWarmup };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			job.fail(errorMessage);
			await this.jobRepository.save(job);
			return { success: false, warmupNeeded: false, error: errorMessage };
		}
	}
}

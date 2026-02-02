import type { ConversationExecutionJob } from "../../../domain/entities/conversation-execution-job";
import type { ConversationExecutionJobRepository } from "../../../domain/repositories/conversation-execution-job-repository";
import type { ConversationRepository } from "../../../domain/repositories/conversation-repository";

export interface AutoCloseWorkerResult {
	success: boolean;
	closed: boolean;
	error?: string;
}

export class AutoCloseWorker {
	constructor(
		private readonly jobRepository: ConversationExecutionJobRepository,
		private readonly conversationRepository: ConversationRepository,
	) {}

	async execute(job: ConversationExecutionJob): Promise<AutoCloseWorkerResult> {
		// Idempotency check
		if (job.status !== "RUNNING") {
			return { success: false, closed: false, error: "Job not in RUNNING state" };
		}

		try {
			const conversation = await this.conversationRepository.findById({
				id: job.conversationId,
			});

			if (!conversation) {
				job.complete();
				await this.jobRepository.save(job);
				return { success: true, closed: false };
			}

			// Check if conversation is already closed
			if (conversation.status === "CLOSED" || conversation.status === "LOST") {
				job.complete();
				await this.jobRepository.save(job);
				return { success: true, closed: false };
			}

			// Check if there was recent activity (reopened)
			if (conversation.lastMessageAt.getTime() > job.createdAt.getTime()) {
				// Conversation had activity after job was created, don't close
				job.cancel();
				await this.jobRepository.save(job);
				return { success: true, closed: false };
			}

			// Emit system event for auto-close
			// Note: We emit the event, but don't directly modify the conversation
			// The ConversationEngine should react to this event
			await this.conversationRepository.saveEvent({
				conversationId: conversation.id,
				type: "SYSTEM",
				action: "CONVERSATION_CLOSED",
				createdAt: new Date(),
			});

			job.complete();
			await this.jobRepository.save(job);

			return { success: true, closed: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			job.fail(errorMessage);
			await this.jobRepository.save(job);
			return { success: false, closed: false, error: errorMessage };
		}
	}
}

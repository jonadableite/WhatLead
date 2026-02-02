import type { ConversationExecutionJob } from "../../../domain/entities/conversation-execution-job";
import type { ConversationExecutionJobRepository } from "../../../domain/repositories/conversation-execution-job-repository";
import type { ConversationRepository } from "../../../domain/repositories/conversation-repository";

export interface SlaTimeoutWorkerResult {
	success: boolean;
	slaBreach: boolean;
	error?: string;
}

export class SlaTimeoutWorker {
	constructor(
		private readonly jobRepository: ConversationExecutionJobRepository,
		private readonly conversationRepository: ConversationRepository,
	) {}

	async execute(job: ConversationExecutionJob): Promise<SlaTimeoutWorkerResult> {
		// Idempotency check
		if (job.status !== "RUNNING") {
			return { success: false, slaBreach: false, error: "Job not in RUNNING state" };
		}

		try {
			const conversation = await this.conversationRepository.findById({
				id: job.conversationId,
			});

			if (!conversation) {
				job.complete();
				await this.jobRepository.save(job);
				return { success: true, slaBreach: false };
			}

			// Check if there was an outbound message after the trigger
			const payload = job.payload ?? {};
			const triggerMessageId = payload.triggerMessageId as string | undefined;
			const slaDeadline = payload.slaDeadline
				? new Date(payload.slaDeadline as string)
				: job.scheduledFor;

			// If conversation had outbound after the trigger, SLA was met
			if (
				conversation.lastOutboundAt &&
				conversation.lastInboundAt &&
				conversation.lastOutboundAt.getTime() > conversation.lastInboundAt.getTime()
			) {
				// SLA was met - outbound happened after inbound
				job.cancel();
				await this.jobRepository.save(job);
				return { success: true, slaBreach: false };
			}

			// Check if we're past the SLA deadline
			const now = new Date();
			if (now.getTime() < slaDeadline.getTime()) {
				// Not yet past deadline, reschedule (will be retried)
				job.fail("SLA deadline not yet reached");
				await this.jobRepository.save(job);
				return { success: false, slaBreach: false, error: "SLA deadline not yet reached" };
			}

			// SLA breach - emit event
			await this.conversationRepository.saveEvent({
				conversationId: conversation.id,
				type: "SYSTEM",
				action: "CONVERSATION_OPENED", // Would be SLA_BREACH in extended schema
				createdAt: new Date(),
			});

			job.complete();
			await this.jobRepository.save(job);

			return { success: true, slaBreach: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			job.fail(errorMessage);
			await this.jobRepository.save(job);
			return { success: false, slaBreach: false, error: errorMessage };
		}
	}
}

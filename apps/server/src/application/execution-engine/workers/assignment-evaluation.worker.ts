import type { ConversationExecutionJob } from "../../../domain/entities/conversation-execution-job";
import type { ConversationExecutionJobRepository } from "../../../domain/repositories/conversation-execution-job-repository";
import type { ConversationRepository } from "../../../domain/repositories/conversation-repository";

export interface AssignmentEvaluationWorkerResult {
	success: boolean;
	reassignmentNeeded: boolean;
	error?: string;
}

export class AssignmentEvaluationWorker {
	constructor(
		private readonly jobRepository: ConversationExecutionJobRepository,
		private readonly conversationRepository: ConversationRepository,
	) {}

	async execute(job: ConversationExecutionJob): Promise<AssignmentEvaluationWorkerResult> {
		// Idempotency check
		if (job.status !== "RUNNING") {
			return { success: false, reassignmentNeeded: false, error: "Job not in RUNNING state" };
		}

		try {
			const conversation = await this.conversationRepository.findById({
				id: job.conversationId,
			});

			if (!conversation) {
				job.complete();
				await this.jobRepository.save(job);
				return { success: true, reassignmentNeeded: false };
			}

			// Check if conversation is still waiting and assigned
			if (conversation.status !== "WAITING" && conversation.status !== "OPEN") {
				// Conversation is closed or in another state, no evaluation needed
				job.complete();
				await this.jobRepository.save(job);
				return { success: true, reassignmentNeeded: false };
			}

			const payload = job.payload ?? {};
			const originalAssignment = payload.assignedTo as
				| { type: string; id: string }
				| undefined;

			// Check if assignment changed since job was created
			const currentAssignment = conversation.assignedTo;
			if (
				originalAssignment &&
				currentAssignment &&
				(originalAssignment.type !== currentAssignment.type ||
					originalAssignment.id !== currentAssignment.id)
			) {
				// Assignment changed, job is no longer relevant
				job.cancel();
				await this.jobRepository.save(job);
				return { success: true, reassignmentNeeded: false };
			}

			// Check if there was activity since assignment
			const hasRecentActivity =
				conversation.lastOutboundAt &&
				conversation.lastOutboundAt.getTime() > job.createdAt.getTime();

			if (hasRecentActivity) {
				// There was activity, assignment is working
				job.complete();
				await this.jobRepository.save(job);
				return { success: true, reassignmentNeeded: false };
			}

			// No activity since assignment - might need reassignment
			// Emit system event indicating evaluation completed
			// (Actual reassignment would be handled by a separate process)
			await this.conversationRepository.saveEvent({
				conversationId: conversation.id,
				type: "SYSTEM",
				action: "CONVERSATION_OPENED", // Would be ASSIGNMENT_TIMEOUT in extended schema
				createdAt: new Date(),
			});

			job.complete();
			await this.jobRepository.save(job);

			return { success: true, reassignmentNeeded: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			job.fail(errorMessage);
			await this.jobRepository.save(job);
			return { success: false, reassignmentNeeded: false, error: errorMessage };
		}
	}
}

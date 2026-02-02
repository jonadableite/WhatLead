import type { Conversation } from "../../domain/entities/conversation";
import type { ConversationTimelineEvent } from "../../domain/entities/conversation-timeline-event";
import type { ConversationExecutionJobRepository } from "../../domain/repositories/conversation-execution-job-repository";
import type { ConversationExecutionQueue } from "./ports/conversation-execution-queue";
import {
	createExecutionJobs,
	type ExecutionPlanner,
} from "./execution-planner";

export class ExecutionEngineUseCase {
	constructor(
		private readonly planner: ExecutionPlanner,
		private readonly jobRepository: ConversationExecutionJobRepository,
		private readonly queue: ConversationExecutionQueue | null,
		private readonly idFactory: { createId(): string },
	) {}

	async planAndEnqueue(
		event: ConversationTimelineEvent & { id: string },
		conversation: Conversation,
	): Promise<void> {
		const plannedJobs = this.planner.plan(event, conversation);

		if (plannedJobs.length === 0) {
			return;
		}

		const jobs = createExecutionJobs({
			plannedJobs,
			conversationId: conversation.id,
			triggerEventId: event.id,
			idFactory: this.idFactory,
		});

		for (const job of jobs) {
			// Check idempotency - skip if job already exists
			const existing = await this.jobRepository.findByUniqueKey({
				conversationId: job.conversationId,
				triggerEventId: job.triggerEventId,
				type: job.type,
			});

			if (existing) {
				continue;
			}

			await this.jobRepository.save(job);

			if (this.queue) {
				await this.queue.enqueue({
					jobId: job.id,
					type: job.type,
					scheduledAt: job.scheduledFor,
				});
			}
		}
	}
}

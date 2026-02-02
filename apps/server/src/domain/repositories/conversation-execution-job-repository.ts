import type { ConversationExecutionJob } from "../entities/conversation-execution-job";
import type { ExecutionJobStatus } from "../value-objects/execution-job-status";
import type { ExecutionJobType } from "../value-objects/execution-job-type";

export interface ConversationExecutionJobRepository {
	findById(id: string): Promise<ConversationExecutionJob | null>;

	findByUniqueKey(params: {
		conversationId: string;
		triggerEventId: string;
		type: ExecutionJobType;
	}): Promise<ConversationExecutionJob | null>;

	save(job: ConversationExecutionJob): Promise<void>;

	findRunnableJobs(params: {
		limit: number;
		now?: Date;
	}): Promise<ConversationExecutionJob[]>;

	findByConversation(params: {
		conversationId: string;
		status?: ExecutionJobStatus;
		limit?: number;
	}): Promise<ConversationExecutionJob[]>;

	claimJob(jobId: string): Promise<boolean>;
}

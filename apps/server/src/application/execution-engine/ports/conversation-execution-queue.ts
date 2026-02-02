import type { ExecutionJobType } from "../../../domain/value-objects/execution-job-type";

export interface ConversationExecutionQueueJob {
	jobId: string;
	type: ExecutionJobType;
	scheduledAt: Date;
}

export interface ConversationExecutionQueue {
	enqueue(job: ConversationExecutionQueueJob): Promise<void>;
}

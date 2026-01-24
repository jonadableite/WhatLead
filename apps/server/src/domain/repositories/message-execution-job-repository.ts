import type { MessageExecutionJob } from "../entities/message-execution-job";

export interface MessageExecutionJobRepository {
	create(job: MessageExecutionJob): Promise<void>;
	findById(jobId: string): Promise<MessageExecutionJob | null>;
	findByIntentId(intentId: string): Promise<MessageExecutionJob | null>;
	save(job: MessageExecutionJob): Promise<void>;

	listRunnable(now: Date, limit: number): Promise<MessageExecutionJob[]>;
	tryClaim(jobId: string, now: Date): Promise<MessageExecutionJob | null>;
}

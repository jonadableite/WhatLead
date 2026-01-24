export interface ExecutionQueueJob {
	jobId: string;
	scheduledAt: Date;
}

export interface ExecutionQueue {
	enqueue(job: ExecutionQueueJob): Promise<void>;
}

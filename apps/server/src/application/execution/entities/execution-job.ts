export type ExecutionJobStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "RETRY";

export class ExecutionJob {
	constructor(
		public readonly id: string,
		public readonly messageIntentId: string,
		public readonly organizationId: string,
		public readonly instanceId: string,
		public status: ExecutionJobStatus,
		public attempts: number,
		public readonly scheduledAt: Date,
		public lastError?: string,
		public executedAt?: Date,
	) {}

	markRunning(): void {
		this.status = "RUNNING";
	}

	markSuccess(): void {
		this.status = "SUCCESS";
		this.executedAt = new Date();
	}

	markFailure(error: string): void {
		this.status = "FAILED";
		this.lastError = error;
	}

	markRetry(error: string): void {
		this.status = "RETRY";
		this.attempts += 1;
		this.lastError = error;
	}
}

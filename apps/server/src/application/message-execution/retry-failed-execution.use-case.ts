import type { MessageExecutionJobRepository } from "../../domain/repositories/message-execution-job-repository";

export interface RetryFailedExecutionUseCaseRequest {
	jobId: string;
	maxAttempts: number;
	now?: Date;
	nextAttemptAt?: Date;
}

export interface RetryFailedExecutionUseCaseResponse {
	status: "RETRY_SCHEDULED" | "IGNORED";
}

export class RetryFailedExecutionUseCase {
	constructor(private readonly jobs: MessageExecutionJobRepository) {}

	async execute(
		request: RetryFailedExecutionUseCaseRequest,
	): Promise<RetryFailedExecutionUseCaseResponse> {
		const now = request.now ?? new Date();
		const job = await this.jobs.findById(request.jobId);
		if (!job) return { status: "IGNORED" };
		const nextAttemptAt = request.nextAttemptAt ?? computeBackoff(job.attempts, now);
		job.markRetry({ maxAttempts: request.maxAttempts, nextAttemptAt });
		await this.jobs.save(job);
		return { status: job.status === "RETRY" ? "RETRY_SCHEDULED" : "IGNORED" };
	}
}

const computeBackoff = (attempts: number, now: Date): Date => {
	const baseSeconds = 10;
	const exp = Math.max(0, attempts - 1);
	const seconds = Math.min(300, Math.pow(2, exp) * baseSeconds);
	return new Date(now.getTime() + seconds * 1000);
};

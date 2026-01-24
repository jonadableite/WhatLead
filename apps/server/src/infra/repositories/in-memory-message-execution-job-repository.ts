import type { MessageExecutionJob } from "../../domain/entities/message-execution-job";
import type { MessageExecutionJobRepository } from "../../domain/repositories/message-execution-job-repository";
import type { MessageExecutionStatus } from "../../domain/value-objects/message-execution-status";

export class InMemoryMessageExecutionJobRepository implements MessageExecutionJobRepository {
	private readonly store = new Map<string, MessageExecutionJob>();

	async create(job: MessageExecutionJob): Promise<void> {
		this.store.set(job.id, job);
	}

	async findById(jobId: string): Promise<MessageExecutionJob | null> {
		return this.store.get(jobId) ?? null;
	}

	async findByIntentId(intentId: string): Promise<MessageExecutionJob | null> {
		for (const job of this.store.values()) {
			if (job.intentId === intentId) return job;
		}
		return null;
	}

	async listByIntentId(
		intentId: string,
		limit: number,
		status?: MessageExecutionStatus,
	): Promise<MessageExecutionJob[]> {
		const jobs = Array.from(this.store.values()).filter(
			(job) => job.intentId === intentId && (!status || job.status === status),
		);
		return jobs.slice(0, limit);
	}

	async save(job: MessageExecutionJob): Promise<void> {
		this.store.set(job.id, job);
	}

	async listRunnable(now: Date, limit: number): Promise<MessageExecutionJob[]> {
		const runnable = [...this.store.values()].filter(
			(j) => j.isRunnable() && (!j.nextAttemptAt || j.nextAttemptAt.getTime() <= now.getTime()),
		);
		return runnable.slice(0, limit);
	}

	async tryClaim(jobId: string, now: Date): Promise<MessageExecutionJob | null> {
		const job = this.store.get(jobId);
		if (!job) return null;
		if (!job.isRunnable()) return null;
		if (job.nextAttemptAt && job.nextAttemptAt.getTime() > now.getTime()) return null;
		job.claim();
		this.store.set(jobId, job);
		return job;
	}
}

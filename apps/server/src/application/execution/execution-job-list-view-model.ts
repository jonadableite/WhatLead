import type { MessageExecutionJob } from "../../domain/entities/message-execution-job";
import type { MessageExecutionStatus } from "../../domain/value-objects/message-execution-status";

export interface ExecutionJobListItemViewModel {
	id: string;
	intentId: string;
	instanceId: string;
	provider: string;
	status: MessageExecutionStatus;
	attempts: number;
	lastError: string | null;
	createdAt: Date;
	executedAt: Date | null;
	nextAttemptAt: Date | null;
}

export const toExecutionJobListItemViewModel = (
	job: MessageExecutionJob,
): ExecutionJobListItemViewModel => ({
	id: job.id,
	intentId: job.intentId,
	instanceId: job.instanceId,
	provider: job.provider,
	status: job.status,
	attempts: job.attempts,
	lastError: job.lastError,
	createdAt: job.createdAt,
	executedAt: job.executedAt,
	nextAttemptAt: job.nextAttemptAt,
});

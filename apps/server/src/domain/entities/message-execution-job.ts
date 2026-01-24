import type { MessageExecutionDomainEvent } from "../events/message-execution-events";
import type { MessageExecutionStatus } from "../value-objects/message-execution-status";

export interface MessageExecutionJobProps {
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

export class MessageExecutionJob {
	private readonly _id: string;
	private readonly _intentId: string;
	private readonly _instanceId: string;
	private readonly _provider: string;
	private _status: MessageExecutionStatus;
	private _attempts: number;
	private _lastError: string | null;
	private readonly _createdAt: Date;
	private _executedAt: Date | null;
	private _nextAttemptAt: Date | null;

	private constructor(props: MessageExecutionJobProps) {
		this._id = props.id;
		this._intentId = props.intentId;
		this._instanceId = props.instanceId;
		this._provider = props.provider;
		this._status = props.status;
		this._attempts = props.attempts;
		this._lastError = props.lastError;
		this._createdAt = props.createdAt;
		this._executedAt = props.executedAt;
		this._nextAttemptAt = props.nextAttemptAt;
	}

	static create(params: {
		id: string;
		intentId: string;
		instanceId: string;
		provider: string;
		now?: Date;
	}): MessageExecutionJob {
		const now = params.now ?? new Date();
		return new MessageExecutionJob({
			id: params.id,
			intentId: params.intentId,
			instanceId: params.instanceId,
			provider: params.provider,
			status: "PENDING",
			attempts: 0,
			lastError: null,
			createdAt: now,
			executedAt: null,
			nextAttemptAt: null,
		});
	}

	static reconstitute(props: MessageExecutionJobProps): MessageExecutionJob {
		return new MessageExecutionJob(props);
	}

	get id(): string {
		return this._id;
	}

	get intentId(): string {
		return this._intentId;
	}

	get instanceId(): string {
		return this._instanceId;
	}

	get provider(): string {
		return this._provider;
	}

	get status(): MessageExecutionStatus {
		return this._status;
	}

	get attempts(): number {
		return this._attempts;
	}

	get lastError(): string | null {
		return this._lastError;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get executedAt(): Date | null {
		return this._executedAt;
	}

	get nextAttemptAt(): Date | null {
		return this._nextAttemptAt;
	}

	isRunnable(): boolean {
		return this._status === "PENDING" || this._status === "RETRY";
	}

	claim(): void {
		if (!this.isRunnable()) return;
		this._status = "PROCESSING";
		this._attempts += 1;
		this._lastError = null;
		this._executedAt = null;
		this._nextAttemptAt = null;
	}

	markSent(params: { intentId: string; now?: Date }): readonly MessageExecutionDomainEvent[] {
		const now = params.now ?? new Date();
		this._status = "SENT";
		this._executedAt = now;
		return [
			{
				type: "MessageSent",
				occurredAt: now,
				jobId: this._id,
				intentId: params.intentId,
				instanceId: this._instanceId,
				provider: this._provider,
			},
		];
	}

	markFailed(params: {
		intentId: string;
		error: string;
		willRetry: boolean;
		now?: Date;
	}): readonly MessageExecutionDomainEvent[] {
		const now = params.now ?? new Date();
		this._status = "FAILED";
		this._lastError = params.error;
		this._executedAt = null;
		this._nextAttemptAt = null;
		return [
			{
				type: "MessageFailed",
				occurredAt: now,
				jobId: this._id,
				intentId: params.intentId,
				instanceId: this._instanceId,
				provider: this._provider,
				error: params.error,
				willRetry: params.willRetry,
			},
		];
	}

	markRetry(params: { maxAttempts: number; nextAttemptAt: Date }): void {
		if (this._status !== "FAILED") return;
		if (this._attempts >= params.maxAttempts) return;
		this._status = "RETRY";
		this._nextAttemptAt = params.nextAttemptAt;
	}
}

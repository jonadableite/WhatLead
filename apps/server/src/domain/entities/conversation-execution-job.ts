import type { ExecutionJobStatus } from "../value-objects/execution-job-status";
import type { ExecutionJobType } from "../value-objects/execution-job-type";

export interface ConversationExecutionJobProps {
	id: string;
	conversationId: string;
	triggerEventId: string;
	type: ExecutionJobType;
	status: ExecutionJobStatus;
	payload: Record<string, unknown> | null;
	scheduledFor: Date;
	attempts: number;
	maxAttempts: number;
	lastError: string | null;
	createdAt: Date;
	executedAt: Date | null;
	failedAt: Date | null;
	cancelledAt: Date | null;
}

export class ConversationExecutionJob {
	private readonly _id: string;
	private readonly _conversationId: string;
	private readonly _triggerEventId: string;
	private readonly _type: ExecutionJobType;
	private _status: ExecutionJobStatus;
	private readonly _payload: Record<string, unknown> | null;
	private readonly _scheduledFor: Date;
	private _attempts: number;
	private readonly _maxAttempts: number;
	private _lastError: string | null;
	private readonly _createdAt: Date;
	private _executedAt: Date | null;
	private _failedAt: Date | null;
	private _cancelledAt: Date | null;

	private constructor(props: ConversationExecutionJobProps) {
		this._id = props.id;
		this._conversationId = props.conversationId;
		this._triggerEventId = props.triggerEventId;
		this._type = props.type;
		this._status = props.status;
		this._payload = props.payload;
		this._scheduledFor = props.scheduledFor;
		this._attempts = props.attempts;
		this._maxAttempts = props.maxAttempts;
		this._lastError = props.lastError;
		this._createdAt = props.createdAt;
		this._executedAt = props.executedAt;
		this._failedAt = props.failedAt;
		this._cancelledAt = props.cancelledAt;
	}

	static create(params: {
		id: string;
		conversationId: string;
		triggerEventId: string;
		type: ExecutionJobType;
		payload?: Record<string, unknown> | null;
		scheduledFor: Date;
		maxAttempts?: number;
	}): ConversationExecutionJob {
		return new ConversationExecutionJob({
			id: params.id,
			conversationId: params.conversationId,
			triggerEventId: params.triggerEventId,
			type: params.type,
			status: "PENDING",
			payload: params.payload ?? null,
			scheduledFor: params.scheduledFor,
			attempts: 0,
			maxAttempts: params.maxAttempts ?? 3,
			lastError: null,
			createdAt: new Date(),
			executedAt: null,
			failedAt: null,
			cancelledAt: null,
		});
	}

	static reconstitute(props: ConversationExecutionJobProps): ConversationExecutionJob {
		return new ConversationExecutionJob(props);
	}

	get id(): string {
		return this._id;
	}

	get conversationId(): string {
		return this._conversationId;
	}

	get triggerEventId(): string {
		return this._triggerEventId;
	}

	get type(): ExecutionJobType {
		return this._type;
	}

	get status(): ExecutionJobStatus {
		return this._status;
	}

	get payload(): Record<string, unknown> | null {
		return this._payload;
	}

	get scheduledFor(): Date {
		return this._scheduledFor;
	}

	get attempts(): number {
		return this._attempts;
	}

	get maxAttempts(): number {
		return this._maxAttempts;
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

	get failedAt(): Date | null {
		return this._failedAt;
	}

	get cancelledAt(): Date | null {
		return this._cancelledAt;
	}

	get uniqueKey(): string {
		return `${this._conversationId}:${this._triggerEventId}:${this._type}`;
	}

	isRunnable(now: Date = new Date()): boolean {
		if (this._status !== "PENDING") {
			return false;
		}
		if (this._scheduledFor.getTime() > now.getTime()) {
			return false;
		}
		return true;
	}

	canRetry(): boolean {
		return this._attempts < this._maxAttempts;
	}

	claim(): void {
		if (this._status !== "PENDING") {
			return;
		}
		this._status = "RUNNING";
		this._attempts += 1;
	}

	complete(executedAt: Date = new Date()): void {
		if (this._status !== "RUNNING") {
			return;
		}
		this._status = "COMPLETED";
		this._executedAt = executedAt;
		this._lastError = null;
	}

	fail(error: string, failedAt: Date = new Date()): void {
		if (this._status !== "RUNNING") {
			return;
		}
		this._lastError = error;
		if (this.canRetry()) {
			this._status = "PENDING";
		} else {
			this._status = "FAILED";
			this._failedAt = failedAt;
		}
	}

	cancel(cancelledAt: Date = new Date()): void {
		if (this._status === "COMPLETED" || this._status === "FAILED" || this._status === "CANCELLED") {
			return;
		}
		this._status = "CANCELLED";
		this._cancelledAt = cancelledAt;
	}
}

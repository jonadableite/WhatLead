import type { ExecutionControlScope } from "../value-objects/execution-control-scope";
import type { ExecutionControlStatus } from "../value-objects/execution-control-status";

export interface ExecutionControlProps {
	id: string;
	scope: ExecutionControlScope;
	scopeId: string;
	status: ExecutionControlStatus;
	reason: string | null;
	pausedUntil: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export class ExecutionControl {
	private readonly _id: string;
	private readonly _scope: ExecutionControlScope;
	private readonly _scopeId: string;
	private _status: ExecutionControlStatus;
	private _reason: string | null;
	private _pausedUntil: Date | null;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor(props: ExecutionControlProps) {
		this._id = props.id;
		this._scope = props.scope;
		this._scopeId = props.scopeId;
		this._status = props.status;
		this._reason = props.reason;
		this._pausedUntil = props.pausedUntil;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
	}

	static create(params: {
		id: string;
		scope: ExecutionControlScope;
		scopeId: string;
		now?: Date;
	}): ExecutionControl {
		const now = params.now ?? new Date();
		return new ExecutionControl({
			id: params.id,
			scope: params.scope,
			scopeId: params.scopeId,
			status: "ACTIVE",
			reason: null,
			pausedUntil: null,
			createdAt: now,
			updatedAt: now,
		});
	}

	static reconstitute(props: ExecutionControlProps): ExecutionControl {
		return new ExecutionControl(props);
	}

	get id(): string {
		return this._id;
	}

	get scope(): ExecutionControlScope {
		return this._scope;
	}

	get scopeId(): string {
		return this._scopeId;
	}

	get status(): ExecutionControlStatus {
		return this._status;
	}

	get reason(): string | null {
		return this._reason;
	}

	get pausedUntil(): Date | null {
		return this._pausedUntil;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	isPaused(now: Date = new Date()): boolean {
		if (this._status !== "PAUSED") return false;
		if (!this._pausedUntil) return true;
		return now.getTime() < this._pausedUntil.getTime();
	}

	pause(params: { reason?: string; until?: Date | null; now?: Date }): void {
		const now = params.now ?? new Date();
		this._status = "PAUSED";
		this._reason = params.reason ?? null;
		this._pausedUntil = params.until ?? null;
		this._updatedAt = now;
	}

	resume(params: { now?: Date }): void {
		const now = params.now ?? new Date();
		this._status = "ACTIVE";
		this._reason = null;
		this._pausedUntil = null;
		this._updatedAt = now;
	}
}


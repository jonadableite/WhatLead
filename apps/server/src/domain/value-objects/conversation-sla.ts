export interface ConversationSLAProps {
	firstResponseDueAt?: Date | null;
	nextResponseDueAt?: Date | null;
	breachedAt?: Date | null;
}

export class ConversationSLA {
	private _firstResponseDueAt: Date | null;
	private _nextResponseDueAt: Date | null;
	private _breachedAt: Date | null;

	private constructor(props: ConversationSLAProps) {
		this._firstResponseDueAt = props.firstResponseDueAt ?? null;
		this._nextResponseDueAt = props.nextResponseDueAt ?? null;
		this._breachedAt = props.breachedAt ?? null;
	}

	static empty(): ConversationSLA {
		return new ConversationSLA({});
	}

	static reconstitute(props: ConversationSLAProps): ConversationSLA {
		return new ConversationSLA(props);
	}

	get firstResponseDueAt(): Date | null {
		return this._firstResponseDueAt;
	}

	get nextResponseDueAt(): Date | null {
		return this._nextResponseDueAt;
	}

	get breachedAt(): Date | null {
		return this._breachedAt;
	}

	startFirstResponse(params: { dueAt: Date }): void {
		this._firstResponseDueAt = params.dueAt;
		this._nextResponseDueAt = null;
	}

	startNextResponse(params: { dueAt: Date }): void {
		this._nextResponseDueAt = params.dueAt;
	}

	clear(): void {
		this._firstResponseDueAt = null;
		this._nextResponseDueAt = null;
		this._breachedAt = null;
	}

	clearBreach(): void {
		this._breachedAt = null;
	}

	markBreached(params: { now: Date }): void {
		if (!this._breachedAt) {
			this._breachedAt = params.now;
		}
	}
}


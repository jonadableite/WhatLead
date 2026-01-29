import type { OperatorStatus } from "../value-objects/operator-status";

export interface OperatorProps {
	id: string;
	organizationId: string;
	userId: string;
	name: string;
	status: OperatorStatus;
	maxConcurrentConversations: number;
	currentConversationCount: number;
	createdAt: Date;
}

export class Operator {
	private readonly _id: string;
	private readonly _organizationId: string;
	private readonly _userId: string;
	private _name: string;
	private _status: OperatorStatus;
	private _maxConcurrentConversations: number;
	private _currentConversationCount: number;
	private readonly _createdAt: Date;

	private constructor(props: OperatorProps) {
		this._id = props.id;
		this._organizationId = props.organizationId;
		this._userId = props.userId;
		this._name = props.name;
		this._status = props.status;
		this._maxConcurrentConversations = props.maxConcurrentConversations;
		this._currentConversationCount = props.currentConversationCount;
		this._createdAt = props.createdAt;
	}

	static create(params: {
		id: string;
		organizationId: string;
		userId: string;
		name: string;
		status?: OperatorStatus;
		maxConcurrentConversations?: number;
	}): Operator {
		return new Operator({
			id: params.id,
			organizationId: params.organizationId,
			userId: params.userId,
			name: params.name,
			status: params.status ?? "OFFLINE",
			maxConcurrentConversations: params.maxConcurrentConversations ?? 20,
			currentConversationCount: 0,
			createdAt: new Date(),
		});
	}

	static reconstitute(props: OperatorProps): Operator {
		return new Operator(props);
	}

	get id(): string {
		return this._id;
	}

	get organizationId(): string {
		return this._organizationId;
	}

	get userId(): string {
		return this._userId;
	}

	get name(): string {
		return this._name;
	}

	get status(): OperatorStatus {
		return this._status;
	}

	get maxConcurrentConversations(): number {
		return this._maxConcurrentConversations;
	}

	get currentConversationCount(): number {
		return this._currentConversationCount;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	isAvailable(): boolean {
		return (
			this._status === "ONLINE" &&
			this._currentConversationCount < this._maxConcurrentConversations
		);
	}

	markOnline(): void {
		this._status = "ONLINE";
	}

	markAway(): void {
		this._status = "AWAY";
	}

	markOffline(): void {
		this._status = "OFFLINE";
	}

	updateName(name: string): void {
		if (!name.trim()) {
			return;
		}
		this._name = name.trim();
	}

	claimConversation(): void {
		if (!this.isAvailable()) {
			return;
		}
		this._currentConversationCount += 1;
	}

	releaseConversation(): void {
		if (this._currentConversationCount <= 0) {
			return;
		}
		this._currentConversationCount -= 1;
	}

	setConversationCount(count: number): void {
		if (count < 0) {
			return;
		}
		this._currentConversationCount = count;
	}
}

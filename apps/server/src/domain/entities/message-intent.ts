import type { MessageIntentDomainEvent } from "../events/message-intent-events";
import type { MessageGateDecisionReason } from "../value-objects/message-gate-decision-reason";
import type { MessageIntentOrigin } from "../value-objects/message-intent-origin";
import type { MessageIntentPayload } from "../value-objects/message-intent-payload";
import type { MessageIntentPurpose } from "../value-objects/message-intent-purpose";
import type { MessageIntentStatus } from "../value-objects/message-intent-status";
import type { MessageIntentType } from "../value-objects/message-intent-type";
import type { MessageTarget } from "../value-objects/message-target";

export interface MessageIntentProps {
	id: string;
	organizationId: string;
	target: MessageTarget;
	type: MessageIntentType;
	purpose: MessageIntentPurpose;
	origin: MessageIntentOrigin | null;
	payload: MessageIntentPayload;
	status: MessageIntentStatus;
	decidedByInstanceId: string | null;
	blockedReason: MessageGateDecisionReason | null;
	queuedUntil: Date | null;
	createdAt: Date;
}

export class MessageIntent {
	private readonly _id: string;
	private readonly _organizationId: string;
	private readonly _target: MessageTarget;
	private readonly _type: MessageIntentType;
	private readonly _purpose: MessageIntentPurpose;
	private readonly _origin: MessageIntentOrigin | null;
	private readonly _payload: MessageIntentPayload;
	private _status: MessageIntentStatus;
	private _decidedByInstanceId: string | null;
	private _blockedReason: MessageGateDecisionReason | null;
	private _queuedUntil: Date | null;
	private readonly _createdAt: Date;

	private constructor(props: MessageIntentProps) {
		this._id = props.id;
		this._organizationId = props.organizationId;
		this._target = props.target;
		this._type = props.type;
		this._purpose = props.purpose;
		this._origin = props.origin;
		this._payload = props.payload;
		this._status = props.status;
		this._decidedByInstanceId = props.decidedByInstanceId;
		this._blockedReason = props.blockedReason;
		this._queuedUntil = props.queuedUntil;
		this._createdAt = props.createdAt;
	}

	static create(params: {
		id: string;
		organizationId: string;
		target: MessageTarget;
		type: MessageIntentType;
		purpose: MessageIntentPurpose;
		origin?: MessageIntentOrigin | null;
		payload: MessageIntentPayload;
		now?: Date;
	}): MessageIntent {
		const now = params.now ?? new Date();
		return new MessageIntent({
			id: params.id,
			organizationId: params.organizationId,
			target: params.target,
			type: params.type,
			purpose: params.purpose,
			origin: params.origin ?? null,
			payload: params.payload,
			status: "PENDING",
			decidedByInstanceId: null,
			blockedReason: null,
			queuedUntil: null,
			createdAt: now,
		});
	}

	static reconstitute(props: MessageIntentProps): MessageIntent {
		return new MessageIntent(props);
	}

	get id(): string {
		return this._id;
	}

	get organizationId(): string {
		return this._organizationId;
	}

	get target(): MessageTarget {
		return this._target;
	}

	get type(): MessageIntentType {
		return this._type;
	}

	get purpose(): MessageIntentPurpose {
		return this._purpose;
	}

	get origin(): MessageIntentOrigin | null {
		return this._origin;
	}

	get payload(): MessageIntentPayload {
		return this._payload;
	}

	get status(): MessageIntentStatus {
		return this._status;
	}

	get decidedByInstanceId(): string | null {
		return this._decidedByInstanceId;
	}

	get blockedReason(): MessageGateDecisionReason | null {
		return this._blockedReason;
	}

	get queuedUntil(): Date | null {
		return this._queuedUntil;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	isPending(now: Date = new Date()): boolean {
		if (this._status === "PENDING") return true;
		if (this._status === "QUEUED" && this._queuedUntil) {
			return now.getTime() >= this._queuedUntil.getTime();
		}
		return false;
	}

	approve(params: { instanceId: string; now?: Date }): readonly MessageIntentDomainEvent[] {
		if (this._status === "SENT" || this._status === "DROPPED") return [];
		const now = params.now ?? new Date();
		this._status = "APPROVED";
		this._decidedByInstanceId = params.instanceId;
		this._blockedReason = null;
		this._queuedUntil = null;
		return [
			{
				type: "MessageApproved",
				occurredAt: now,
				intentId: this._id,
				organizationId: this._organizationId,
				instanceId: params.instanceId,
			},
		];
	}

	queue(params: {
		queuedUntil: Date;
		reason: MessageGateDecisionReason;
		now?: Date;
	}): readonly MessageIntentDomainEvent[] {
		if (this._status === "SENT" || this._status === "DROPPED") return [];
		const now = params.now ?? new Date();
		this._status = "QUEUED";
		this._queuedUntil = params.queuedUntil;
		this._blockedReason = params.reason;
		this._decidedByInstanceId = null;
		return [
			{
				type: "MessageQueued",
				occurredAt: now,
				intentId: this._id,
				organizationId: this._organizationId,
				queuedUntil: params.queuedUntil,
				reason: params.reason,
			},
		];
	}

	block(params: { reason: MessageGateDecisionReason; now?: Date }): readonly MessageIntentDomainEvent[] {
		if (this._status === "SENT" || this._status === "DROPPED") return [];
		const now = params.now ?? new Date();
		this._status = "BLOCKED";
		this._blockedReason = params.reason;
		this._queuedUntil = null;
		this._decidedByInstanceId = null;
		return [
			{
				type: "MessageBlocked",
				occurredAt: now,
				intentId: this._id,
				organizationId: this._organizationId,
				reason: params.reason,
			},
		];
	}

	markSent(): void {
		if (this._status === "SENT" || this._status === "DROPPED") return;
		this._status = "SENT";
		this._blockedReason = null;
		this._queuedUntil = null;
	}
}

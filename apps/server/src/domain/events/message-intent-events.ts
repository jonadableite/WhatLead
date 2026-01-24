import type { MessageGateDecisionReason } from "../value-objects/message-gate-decision-reason";

export type MessageIntentDomainEvent =
	| MessageApprovedEvent
	| MessageQueuedEvent
	| MessageBlockedEvent;

export interface MessageApprovedEvent {
	type: "MessageApproved";
	occurredAt: Date;
	intentId: string;
	organizationId: string;
	instanceId: string;
}

export interface MessageQueuedEvent {
	type: "MessageQueued";
	occurredAt: Date;
	intentId: string;
	organizationId: string;
	queuedUntil: Date;
	reason: MessageGateDecisionReason;
}

export interface MessageBlockedEvent {
	type: "MessageBlocked";
	occurredAt: Date;
	intentId: string;
	organizationId: string;
	reason: MessageGateDecisionReason;
}


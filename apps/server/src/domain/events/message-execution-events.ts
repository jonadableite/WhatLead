export type MessageExecutionDomainEvent = MessageSentEvent | MessageFailedEvent;

export interface MessageSentEvent {
	type: "MessageSent";
	occurredAt: Date;
	jobId: string;
	intentId: string;
	instanceId: string;
	provider: string;
}

export interface MessageFailedEvent {
	type: "MessageFailed";
	occurredAt: Date;
	jobId: string;
	intentId: string;
	instanceId: string;
	provider: string;
	error: string;
	willRetry: boolean;
}


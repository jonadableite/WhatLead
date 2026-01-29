import type { MessageDeliveryStatus } from "../value-objects/message-delivery-status";
import type { MessageDirection } from "../value-objects/message-direction";
import type { MessageSender } from "../value-objects/message-sender";
import type { MessageType } from "../value-objects/message-type";

export interface ChatMessagePayload {
	id: string;
	direction: MessageDirection;
	type: MessageType;
	sentBy: MessageSender;
	status: MessageDeliveryStatus;
	body?: string;
}

export interface ChatMessageEventBase {
	type: "MESSAGE_RECEIVED" | "MESSAGE_SENT" | "MESSAGE_STATUS_UPDATED";
	occurredAt: Date;
	organizationId: string;
	instanceId: string;
	conversationId: string;
	message: ChatMessagePayload;
}

export type ChatMessageDomainEvent = ChatMessageEventBase;

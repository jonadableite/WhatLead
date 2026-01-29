import type { Message } from "../entities/message";
import type { MessageDeliveryStatus } from "../value-objects/message-delivery-status";

export interface MessageRepository {
	existsByProviderMessageId(params: {
		conversationId: string;
		providerMessageId: string;
	}): Promise<boolean>;

	append(message: Message): Promise<void>;

	findLatestPendingOutbound(params: { conversationId: string }): Promise<Message | null>;

	updateDelivery(params: {
		messageId: string;
		status: MessageDeliveryStatus;
		providerMessageId?: string;
		occurredAt?: Date;
		contentRef?: string;
		metadata?: Record<string, unknown>;
	}): Promise<void>;
}


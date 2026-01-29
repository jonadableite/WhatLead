import { Message } from "../../domain/entities/message";
import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { MessageDeliveryStatus } from "../../domain/value-objects/message-delivery-status";

export class InMemoryMessageRepository implements MessageRepository {
	private readonly byConversationId = new Map<string, Message[]>();

	async existsByProviderMessageId(params: {
		conversationId: string;
		providerMessageId: string;
	}): Promise<boolean> {
		const list = this.byConversationId.get(params.conversationId) ?? [];
		return list.some((m) => m.providerMessageId === params.providerMessageId);
	}

	async append(message: Message): Promise<void> {
		const list = this.byConversationId.get(message.conversationId) ?? [];
		list.push(message);
		this.byConversationId.set(message.conversationId, list);
	}

	async findLatestPendingOutbound(params: {
		conversationId: string;
	}): Promise<Message | null> {
		const list = this.byConversationId.get(params.conversationId) ?? [];
		const pending = list
			.filter((message) => message.direction === "OUTBOUND" && message.status === "PENDING")
			.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
		return pending[0] ?? null;
	}

	async updateDelivery(params: {
		messageId: string;
		status: MessageDeliveryStatus;
		providerMessageId?: string;
		occurredAt?: Date;
		contentRef?: string;
		metadata?: Record<string, unknown>;
	}): Promise<void> {
		for (const [conversationId, list] of this.byConversationId.entries()) {
			const index = list.findIndex((message) => message.id === params.messageId);
			if (index < 0) {
				continue;
			}
			const current = list[index]!;
			const next = Message.reconstitute({
				id: current.id,
				conversationId: current.conversationId,
				direction: current.direction,
				type: current.type,
				sentBy: current.sentBy,
				status: params.status,
				providerMessageId: params.providerMessageId ?? current.providerMessageId,
				contentRef: params.contentRef ?? current.contentRef,
				metadata: params.metadata ?? current.metadata,
				occurredAt: params.occurredAt ?? current.occurredAt,
			});
			list[index] = next;
			this.byConversationId.set(conversationId, list);
			return;
		}
	}
}


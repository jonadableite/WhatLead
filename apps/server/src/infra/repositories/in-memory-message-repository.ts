import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { Message } from "../../domain/entities/message";

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
}


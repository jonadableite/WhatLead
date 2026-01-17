import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { Conversation } from "../../domain/entities/conversation";

export class InMemoryConversationRepository implements ConversationRepository {
	private readonly byId = new Map<string, Conversation>();

	async findActiveByInstanceAndContact(params: {
		instanceId: string;
		contactId: string;
	}): Promise<Conversation | null> {
		for (const conversation of this.byId.values()) {
			if (
				conversation.isActive &&
				conversation.instanceId === params.instanceId &&
				conversation.contactId === params.contactId
			) {
				return conversation;
			}
		}
		return null;
	}

	async save(conversation: Conversation): Promise<void> {
		this.byId.set(conversation.id, conversation);
	}
}


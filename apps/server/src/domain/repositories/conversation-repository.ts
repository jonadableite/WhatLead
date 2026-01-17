import type { Conversation } from "../entities/conversation";

export interface ConversationRepository {
	findActiveByInstanceAndContact(params: {
		instanceId: string;
		contactId: string;
	}): Promise<Conversation | null>;

	findById(params: { id: string }): Promise<Conversation | null>;

	save(conversation: Conversation): Promise<void>;
}

import type { Message } from "../entities/message";

export interface MessageRepository {
	existsByProviderMessageId(params: {
		conversationId: string;
		providerMessageId: string;
	}): Promise<boolean>;

	append(message: Message): Promise<void>;
}


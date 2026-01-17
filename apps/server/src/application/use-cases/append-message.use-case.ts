import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { MessageDirection } from "../../domain/value-objects/message-direction";
import type { MessageSender } from "../../domain/value-objects/message-sender";
import type { MessageType } from "../../domain/value-objects/message-type";
import type { Conversation } from "../../domain/entities/conversation";

export class AppendMessageUseCase {
	constructor(
		private readonly conversationRepository: ConversationRepository,
		private readonly messageRepository: MessageRepository,
		private readonly idFactory: { createId(): string },
	) {}

	async execute(params: {
		conversation: Conversation;
		direction: MessageDirection;
		type: MessageType;
		sentBy: MessageSender;
		providerMessageId?: string;
		contentRef?: string;
		metadata?: Record<string, unknown>;
		occurredAt: Date;
	}): Promise<void> {
		if (params.providerMessageId) {
			const exists = await this.messageRepository.existsByProviderMessageId({
				conversationId: params.conversation.id,
				providerMessageId: params.providerMessageId,
			});
			if (exists) {
				return;
			}
		}

		const message = params.conversation.appendMessage({
			messageId: this.idFactory.createId(),
			direction: params.direction,
			type: params.type,
			sentBy: params.sentBy,
			providerMessageId: params.providerMessageId,
			contentRef: params.contentRef,
			metadata: params.metadata,
			occurredAt: params.occurredAt,
		});

		await this.messageRepository.append(message);
		await this.conversationRepository.save(params.conversation);
	}
}


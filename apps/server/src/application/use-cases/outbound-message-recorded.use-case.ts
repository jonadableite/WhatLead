import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { MessageRepository } from "../../domain/repositories/message-repository";

export class OutboundMessageRecordedUseCase {
	constructor(
		private readonly conversationRepository: ConversationRepository,
		private readonly messageRepository: MessageRepository,
		private readonly idFactory: { createId(): string },
	) {}

	async execute(event: NormalizedWhatsAppEvent): Promise<void> {
		if (event.type !== "MESSAGE_SENT") {
			return;
		}

		const contactId = normalizeContactId(event.remoteJid);
		if (!contactId) {
			return;
		}

		const conversation = await this.conversationRepository.findActiveByInstanceAndContact({
			instanceId: event.instanceId,
			contactId,
		});
		if (!conversation) {
			return;
		}

		if (event.messageId) {
			const exists = await this.messageRepository.existsByProviderMessageId({
				conversationId: conversation.id,
				providerMessageId: event.messageId,
			});
			if (exists) {
				return;
			}
		}

		const message = conversation.recordOutboundMessage({
			messageId: this.idFactory.createId(),
			type: inferMessageType(event),
			sentBy: "BOT",
			providerMessageId: event.messageId,
			contentRef: inferContentRef(event),
			metadata: event.metadata,
			occurredAt: event.occurredAt,
		});

		await this.messageRepository.append(message);
		await this.conversationRepository.save(conversation);
	}
}

const normalizeContactId = (remoteJid: string | undefined): string | null => {
	if (!remoteJid) {
		return null;
	}
	const trimmed = remoteJid.trim();
	if (!trimmed) {
		return null;
	}
	return trimmed;
};

const inferMessageType = (event: NormalizedWhatsAppEvent) => {
	const messageType = event.metadata?.["messageType"];
	if (messageType === "audio") return "AUDIO";
	if (messageType === "image") return "IMAGE";
	if (messageType === "sticker") return "STICKER";
	return "TEXT";
};

const inferContentRef = (event: NormalizedWhatsAppEvent): string | undefined => {
	const text = event.metadata?.["text"];
	if (typeof text === "string" && text.trim()) {
		return text;
	}
	return undefined;
};


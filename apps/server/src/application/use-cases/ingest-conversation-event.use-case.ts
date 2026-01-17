import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import { FindOrCreateConversationUseCase } from "./find-or-create-conversation.use-case";
import { AppendMessageUseCase } from "./append-message.use-case";
import type { MessageRepository } from "../../domain/repositories/message-repository";

export class IngestConversationEventUseCase {
	private readonly findOrCreateConversation: FindOrCreateConversationUseCase;
	private readonly appendMessage: AppendMessageUseCase;
	private readonly conversationRepository: ConversationRepository;

	constructor(params: {
		instanceRepository: InstanceRepository;
		conversationRepository: ConversationRepository;
		messageRepository: MessageRepository;
		idFactory: { createId(): string };
	}) {
		this.conversationRepository = params.conversationRepository;
		this.findOrCreateConversation = new FindOrCreateConversationUseCase(
			params.instanceRepository,
			params.conversationRepository,
			params.idFactory,
		);
		this.appendMessage = new AppendMessageUseCase(
			params.conversationRepository,
			params.messageRepository,
			params.idFactory,
		);
	}

	async execute(event: NormalizedWhatsAppEvent): Promise<void> {
		const contactId = normalizeContactId(event.remoteJid);
		if (!contactId) {
			return;
		}

		if (event.type === "MESSAGE_RECEIVED" || event.type === "GROUP_MESSAGE_RECEIVED") {
			const conversation = await this.findOrCreateConversation.execute({
				instanceId: event.instanceId,
				contactId,
				now: event.occurredAt,
			});

			await this.appendMessage.execute({
				conversation,
				direction: "INBOUND",
				type: inferMessageType(event),
				sentBy: "INSTANCE",
				providerMessageId: event.messageId,
				contentRef: inferContentRef(event),
				metadata: event.metadata,
				occurredAt: event.occurredAt,
			});

			return;
		}

		if (event.type === "MESSAGE_SENT") {
			const conversation =
				await this.conversationRepository.findActiveByInstanceAndContact({
					instanceId: event.instanceId,
					contactId,
				});
			if (!conversation) {
				return;
			}

			await this.appendMessage.execute({
				conversation,
				direction: "OUTBOUND",
				type: inferMessageType(event),
				sentBy: "BOT",
				providerMessageId: event.messageId,
				contentRef: inferContentRef(event),
				metadata: event.metadata,
				occurredAt: event.occurredAt,
			});
		}
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
	if (event.type === "REACTION_SENT" || event.type === "REACTION_RECEIVED") {
		return "REACTION";
	}
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

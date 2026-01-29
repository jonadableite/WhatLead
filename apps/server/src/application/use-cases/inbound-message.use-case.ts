import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import { FindOrCreateConversationUseCase } from "./find-or-create-conversation.use-case";
import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { ChatMessageDomainEvent } from "../../domain/events/chat-message-events";

export class InboundMessageUseCase {
	private readonly findOrCreateConversation: FindOrCreateConversationUseCase;

	constructor(params: {
		instanceRepository: InstanceRepository;
		conversationRepository: ConversationRepository;
		messageRepository: MessageRepository;
		idFactory: { createId(): string };
		eventBus: DomainEventBus<ChatMessageDomainEvent>;
	}) {
		this.eventBus = params.eventBus;
		this.findOrCreateConversation = new FindOrCreateConversationUseCase(
			params.instanceRepository,
			params.conversationRepository,
			params.idFactory,
		);

		this.appendInbound = async (args) => {
			if (args.providerMessageId) {
				const exists = await params.messageRepository.existsByProviderMessageId({
					conversationId: args.conversation.id,
					providerMessageId: args.providerMessageId,
				});
				if (exists) {
					return;
				}
			}

			const message = args.conversation.receiveInboundMessage({
				messageId: params.idFactory.createId(),
				type: args.type,
				providerMessageId: args.providerMessageId,
				contentRef: args.contentRef,
				metadata: args.metadata,
				occurredAt: args.occurredAt,
			});

			await params.messageRepository.append(message);
			await params.conversationRepository.save(args.conversation);
			await this.eventBus.publish({
				type: "MESSAGE_RECEIVED",
				occurredAt: message.occurredAt,
				organizationId: args.conversation.tenantId,
				instanceId: args.conversation.instanceId,
				conversationId: args.conversation.id,
				message: {
					id: message.id,
					direction: message.direction,
					type: message.type,
					sentBy: message.sentBy,
					status: message.status,
					body: message.contentRef,
				},
			});
		};
	}

	private readonly appendInbound: (args: {
		conversation: import("../../domain/entities/conversation").Conversation;
		type: import("../../domain/value-objects/message-type").MessageType;
		providerMessageId?: string;
		contentRef?: string;
		metadata?: Record<string, unknown>;
		occurredAt: Date;
	}) => Promise<void>;
	private readonly eventBus: DomainEventBus<ChatMessageDomainEvent>;

	async execute(event: NormalizedWhatsAppEvent): Promise<{ conversationId: string } | null> {
		if (event.type !== "MESSAGE_RECEIVED" && event.type !== "GROUP_MESSAGE_RECEIVED") {
			return null;
		}

		const contactId = normalizeContactId(event.remoteJid);
		if (!contactId) {
			return null;
		}

		const conversation = await this.findOrCreateConversation.execute({
			instanceId: event.instanceId,
			contactId,
			now: event.occurredAt,
		});

		await this.appendInbound({
			conversation,
			type: inferMessageType(event),
			providerMessageId: event.messageId,
			contentRef: inferContentRef(event),
			metadata: event.metadata,
			occurredAt: event.occurredAt,
		});

		return { conversationId: conversation.id };
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

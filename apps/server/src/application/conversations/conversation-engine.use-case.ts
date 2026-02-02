import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { ChatMessageDomainEvent } from "../../domain/events/chat-message-events";
import type { ConversationKind } from "../../domain/value-objects/conversation-kind";
import type { MessageSender } from "../../domain/value-objects/message-sender";
import type { MessageType } from "../../domain/value-objects/message-type";
import { FindOrCreateConversationUseCase } from "../use-cases/find-or-create-conversation.use-case";

export class ConversationEngineUseCase {
	private readonly findOrCreateConversation: FindOrCreateConversationUseCase;

	constructor(params: {
		instanceRepository: import("../../domain/repositories/instance-repository").InstanceRepository;
		conversationRepository: ConversationRepository;
		messageRepository: MessageRepository;
		idFactory: { createId(): string };
		eventBus: DomainEventBus<ChatMessageDomainEvent>;
	}) {
		this.conversations = params.conversationRepository;
		this.messages = params.messageRepository;
		this.idFactory = params.idFactory;
		this.eventBus = params.eventBus;
		this.findOrCreateConversation = new FindOrCreateConversationUseCase(
			params.instanceRepository,
			params.conversationRepository,
			params.idFactory,
		);
	}

	private readonly conversations: ConversationRepository;
	private readonly messages: MessageRepository;
	private readonly idFactory: { createId(): string };
	private readonly eventBus: DomainEventBus<ChatMessageDomainEvent>;

	async processInbound(params: {
		event: NormalizedWhatsAppEvent;
		contactId: string;
		leadId?: string | null;
		kind?: ConversationKind;
	}): Promise<{ conversationId: string } | null> {
		const { event } = params;
		if (event.type !== "MESSAGE_RECEIVED") {
			return null;
		}

		const conversation = await this.findOrCreateConversation.execute({
			instanceId: event.instanceId,
			contactId: params.contactId,
			leadId: params.leadId ?? null,
			kind: params.kind ?? "PRIVATE",
			now: event.occurredAt,
		});
		const wasClosed =
			conversation.status === "CLOSED" || conversation.status === "LOST";
		const shouldEmitOpened =
			conversation.lastInboundAt === null &&
			conversation.lastOutboundAt === null &&
			conversation.unreadCount === 0;

		if (event.messageId) {
			const exists = await this.messages.existsByProviderMessageId({
				conversationId: conversation.id,
				providerMessageId: event.messageId,
			});
			if (exists) {
				return { conversationId: conversation.id };
			}
		}

		const message = conversation.receiveInboundMessage({
			messageId: this.idFactory.createId(),
			type: inferMessageType(event),
			providerMessageId: event.messageId,
			contentRef: inferContentRef(event),
			metadata: event.metadata,
			occurredAt: event.occurredAt,
		});

		await this.messages.append(message);
		await this.conversations.save(conversation);
		if (shouldEmitOpened) {
			await this.conversations.saveEvent({
				conversationId: conversation.id,
				type: "SYSTEM",
				action: "CONVERSATION_OPENED",
				createdAt: event.occurredAt,
			});
		} else if (wasClosed) {
			await this.conversations.saveEvent({
				conversationId: conversation.id,
				type: "SYSTEM",
				action: "CONVERSATION_OPENED",
				createdAt: event.occurredAt,
			});
		}
		await this.eventBus.publish({
			type: "MESSAGE_RECEIVED",
			occurredAt: message.occurredAt,
			organizationId: conversation.tenantId,
			instanceId: conversation.instanceId,
			conversationId: conversation.id,
			message: {
				id: message.id,
				direction: message.direction,
				type: message.type,
				sentBy: message.sentBy,
				status: message.status,
				body: message.contentRef,
			},
		});

		return { conversationId: conversation.id };
	}

	async processManualSend(params: {
		conversation: import("../../domain/entities/conversation").Conversation;
		body: string;
		occurredAt: Date;
		metadata?: Record<string, unknown>;
		sentBy?: Exclude<MessageSender, "CONTACT">;
		type?: MessageType;
	}): Promise<import("../../domain/entities/message").Message> {
		if (
			!params.conversation.isActive ||
			params.conversation.status === "CLOSED" ||
			params.conversation.status === "LOST"
		) {
			throw new Error("CONVERSATION_CLOSED");
		}

		const message = params.conversation.recordPendingOutboundMessage({
			messageId: this.idFactory.createId(),
			type: params.type ?? "TEXT",
			sentBy: params.sentBy ?? "BOT",
			contentRef: params.body,
			metadata: params.metadata,
			occurredAt: params.occurredAt,
		});
		params.conversation.markAsWaiting();

		await this.messages.append(message);
		await this.conversations.save(params.conversation);
		return message;
	}
}

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
	const caption = event.metadata?.["caption"];
	if (typeof caption === "string" && caption.trim()) {
		return caption;
	}
	return undefined;
};

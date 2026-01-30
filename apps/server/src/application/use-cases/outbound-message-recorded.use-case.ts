import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { ChatMessageDomainEvent } from "../../domain/events/chat-message-events";
import { parseContactIdentity } from "../conversations/contact-utils";
import { MESSAGE_SENDERS, type MessageSender } from "../../domain/value-objects/message-sender";

export class OutboundMessageRecordedUseCase {
	constructor(
		private readonly conversationRepository: ConversationRepository,
		private readonly messageRepository: MessageRepository,
		private readonly idFactory: { createId(): string },
		private readonly eventBus: DomainEventBus<ChatMessageDomainEvent>,
	) {}

	async execute(event: NormalizedWhatsAppEvent): Promise<void> {
		if (event.type !== "MESSAGE_SENT") {
			return;
		}

		const identity = parseContactIdentity(event.remoteJid);
		if (!identity) return;
		const contactId = identity.contactId;

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

		const pending = await this.messageRepository.findLatestPendingOutbound({
			conversationId: conversation.id,
		});
		if (pending) {
			const mergedMetadata = mergeMetadata(pending.metadata, event.metadata);
			await this.messageRepository.updateDelivery({
				messageId: pending.id,
				status: "SENT",
				providerMessageId: event.messageId,
				occurredAt: event.occurredAt,
				contentRef: pending.contentRef ?? inferContentRef(event),
				metadata: mergedMetadata,
			});
			conversation.confirmOutboundMessageSent({ occurredAt: event.occurredAt });
			await this.conversationRepository.save(conversation);
			await this.eventBus.publish({
				type: "MESSAGE_SENT",
				occurredAt: event.occurredAt,
				organizationId: conversation.tenantId,
				instanceId: conversation.instanceId,
				conversationId: conversation.id,
				message: {
					id: pending.id,
					direction: pending.direction,
					type: pending.type,
					sentBy: pending.sentBy,
					status: "SENT",
					body: pending.contentRef ?? inferContentRef(event),
				},
			});
			return;
		}

		const message = conversation.recordOutboundMessage({
			messageId: this.idFactory.createId(),
			type: inferMessageType(event),
			sentBy: inferSentBy(event),
			providerMessageId: event.messageId,
			contentRef: inferContentRef(event),
			metadata: event.metadata,
			occurredAt: event.occurredAt,
		});

		await this.messageRepository.append(message);
		await this.conversationRepository.save(conversation);
		await this.eventBus.publish({
			type: "MESSAGE_SENT",
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
	return undefined;
};

const mergeMetadata = (
	existing: Record<string, unknown>,
	next: Record<string, unknown> | undefined,
): Record<string, unknown> => ({
	...existing,
	...(next ?? {}),
});

const inferSentBy = (event: NormalizedWhatsAppEvent): Exclude<MessageSender, "CONTACT"> => {
	const candidate = event.metadata?.["sentBy"];
	if (
		typeof candidate === "string" &&
		MESSAGE_SENDERS.includes(candidate as MessageSender) &&
		candidate !== "CONTACT"
	) {
		return candidate as Exclude<MessageSender, "CONTACT">;
	}
	return "BOT";
};


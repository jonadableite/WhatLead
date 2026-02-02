import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { LeadRepository } from "../../domain/repositories/lead-repository";
import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { ChatMessageDomainEvent } from "../../domain/events/chat-message-events";
import type { CreateMessageIntentUseCase } from "../message-intents/create-message-intent.use-case";
import type { DecideMessageIntentUseCase } from "../message-intents/decide-message-intent.use-case";
import { resolveOutboundRecipient } from "./contact-utils";
import type { ConversationEngineUseCase } from "./conversation-engine.use-case";

export interface SendChatMessageUseCaseRequest {
	tenantId: string;
	conversationId: string;
	body: string;
	now?: Date;
}

export interface SendChatMessageUseCaseResponse {
	intentId: string;
	status: string;
	decision:
		| { kind: "APPROVED"; instanceId: string }
		| { kind: "QUEUED"; queuedUntil: Date; reason: string }
		| { kind: "BLOCKED"; reason: string };
}

export class SendChatMessageUseCase {
	constructor(
		private readonly conversations: ConversationRepository,
		private readonly messages: MessageRepository,
		private readonly leads: LeadRepository,
		private readonly createIntent: CreateMessageIntentUseCase,
		private readonly decideIntent: DecideMessageIntentUseCase,
		private readonly eventBus: DomainEventBus<ChatMessageDomainEvent>,
		private readonly conversationEngine: ConversationEngineUseCase,
	) {}

	async execute(
		request: SendChatMessageUseCaseRequest,
	): Promise<SendChatMessageUseCaseResponse> {
		const body = request.body.trim();
		if (!body) {
			throw new Error("EMPTY_MESSAGE");
		}

		const conversation = await this.conversations.findById({
			id: request.conversationId,
		});
		if (!conversation || conversation.tenantId !== request.tenantId) {
			throw new Error("CONVERSATION_NOT_FOUND");
		}

		const lead = conversation.leadId
			? await this.leads.findById({ id: conversation.leadId })
			: null;
		const recipient = resolveOutboundRecipient({
			conversationContactId: conversation.contactId,
			lead,
		});
		if (!recipient) {
			throw new Error("RECIPIENT_NOT_FOUND");
		}

		const intent = await this.createIntent.execute({
			organizationId: request.tenantId,
			target: { kind: "PHONE", value: recipient },
			type: "TEXT",
			purpose: "DISPATCH",
			origin: "CHAT_MANUAL",
			payload: { type: "TEXT", text: body },
			now: request.now,
		});

		const occurredAt = request.now ?? new Date();
		const message = await this.conversationEngine.processManualSend({
			conversation,
			body,
			occurredAt,
			metadata: { origin: "CHAT_MANUAL", intentId: intent.intentId },
			sentBy: "BOT",
			type: "TEXT",
		});
		await this.eventBus.publish({
			type: "MESSAGE_STATUS_UPDATED",
			occurredAt: occurredAt,
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

		const decision = await this.decideIntent.execute({
			intentId: intent.intentId,
			organizationId: request.tenantId,
			now: request.now,
		});

		if (decision.decision.kind === "BLOCKED") {
			await this.messages.updateDelivery({
				messageId: message.id,
				status: "FAILED",
				metadata: {
					origin: "CHAT_MANUAL",
					intentId: intent.intentId,
					blockedReason: decision.decision.reason,
				},
			});
			await this.eventBus.publish({
				type: "MESSAGE_STATUS_UPDATED",
				occurredAt: new Date(),
				organizationId: conversation.tenantId,
				instanceId: conversation.instanceId,
				conversationId: conversation.id,
				message: {
					id: message.id,
					direction: message.direction,
					type: message.type,
					sentBy: message.sentBy,
					status: "FAILED",
					body: message.contentRef,
				},
			});
		}

		return {
			intentId: decision.intentId,
			status: decision.status,
			decision: decision.decision,
		};
	}
}

import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { CreateMessageIntentUseCase } from "../message-intents/create-message-intent.use-case";
import type { DecideMessageIntentUseCase } from "../message-intents/decide-message-intent.use-case";

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
		private readonly createIntent: CreateMessageIntentUseCase,
		private readonly decideIntent: DecideMessageIntentUseCase,
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

		const intent = await this.createIntent.execute({
			organizationId: request.tenantId,
			target: { kind: "PHONE", value: conversation.contactId },
			type: "TEXT",
			purpose: "DISPATCH",
			payload: { type: "TEXT", text: body },
			now: request.now,
		});

		const decision = await this.decideIntent.execute({
			intentId: intent.intentId,
			organizationId: request.tenantId,
			now: request.now,
		});

		return {
			intentId: decision.intentId,
			status: decision.status,
			decision: decision.decision,
		};
	}
}

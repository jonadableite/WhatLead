import type { DispatchUseCase } from "../dispatch/dispatch.use-case";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { LeadRepository } from "../../domain/repositories/lead-repository";
import type { ReplyIntent } from "./reply-intent";
import { resolveOutboundRecipient } from "../conversations/contact-utils";

export class ReplyIntentDispatcher {
	constructor(
		private readonly dispatch: DispatchUseCase,
		private readonly conversations: ConversationRepository,
		private readonly leads: LeadRepository,
	) {}

	async execute(intent: ReplyIntent): Promise<void> {
		if (intent.type === "NONE") {
			return;
		}

		const conversation = await this.conversations.findById({ id: intent.conversationId });
		if (!conversation) {
			return;
		}

		const lead = conversation.leadId ? await this.leads.findById({ id: conversation.leadId }) : null;
		const recipient = resolveOutboundRecipient({
			conversationContactId: conversation.contactId,
			lead,
		});
		if (!recipient) {
			return;
		}

		if (intent.type === "TEXT") {
			const out = await this.dispatch.execute({
				instanceId: intent.instanceId,
				conversationId: intent.conversationId,
				intent: { source: "BOT", reason: intent.reason },
				message: { type: "TEXT", to: recipient, text: intent.payload.text },
			});
			if (out.result.status === "BLOCKED") {
				return;
			}
			return;
		}

		if (intent.type === "REACTION") {
			const out = await this.dispatch.execute({
				instanceId: intent.instanceId,
				conversationId: intent.conversationId,
				intent: { source: "BOT", reason: intent.reason },
				message: {
					type: "REACTION",
					to: recipient,
					messageId: intent.payload.messageId,
					emoji: intent.payload.emoji,
				},
			});
			if (out.result.status === "BLOCKED") {
				return;
			}
		}
	}
}

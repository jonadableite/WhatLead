import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { LeadRepository } from "../../domain/repositories/lead-repository";

export class UpdateLeadOnInboundUseCase {
	constructor(
		private readonly conversations: ConversationRepository,
		private readonly leads: LeadRepository,
	) {}

	async execute(params: { conversationId: string; event: NormalizedWhatsAppEvent }): Promise<void> {
		if (params.event.type !== "MESSAGE_RECEIVED" && params.event.type !== "GROUP_MESSAGE_RECEIVED") {
			return;
		}

		const conversation = await this.conversations.findById({ id: params.conversationId });
		if (!conversation?.leadId) {
			return;
		}

		const lead = await this.leads.findById({ id: conversation.leadId });
		if (!lead) {
			return;
		}

		if (lead.stage === "NEW" || lead.stage === "CONTACTED") {
			lead.changeStage("QUALIFIED");
			await this.leads.save(lead);
		}
	}
}


import type { AgentRepository } from "../../domain/repositories/agent-repository";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { SLAEvaluator } from "../../domain/services/sla-evaluator";
import type { DispatchIntent } from "../dispatch-gate/dispatch-intent";

export class AgentOrchestratorUseCase {
	constructor(
		private readonly conversations: ConversationRepository,
		private readonly agents: AgentRepository,
		private readonly slaEvaluator: SLAEvaluator,
	) {}

	async execute(params: { conversationId: string; now?: Date }): Promise<DispatchIntent | null> {
		const now = params.now ?? new Date();
		const conversation = await this.conversations.findById({ id: params.conversationId });
		if (!conversation) return null;
		if (!conversation.isActive) return null;

		const onlineAgents = await this.agents.listOnlineByOrganization({
			organizationId: conversation.tenantId,
		});

		if (conversation.assignedAgentId) {
			return null;
		}

		const slaStatus = this.slaEvaluator.evaluate(conversation, now);
		if (slaStatus === "BREACHED") {
			const followUpAgent = onlineAgents.find((a) => a.purpose === "FOLLOW_UP");
			if (!followUpAgent) return null;
			return {
				instanceId: conversation.instanceId,
				conversationId: conversation.id,
				type: "FOLLOW_UP",
				payload: { type: "TEXT", to: conversation.contactId, text: "So confirmando se voce viu nossa ultima mensagem." },
				reason: "AGENT",
				now,
			};
		}

		const sdr = onlineAgents.find((a) => a.purpose === "SDR");
		if (!sdr) return null;

		return {
			instanceId: conversation.instanceId,
			conversationId: conversation.id,
			type: "REPLY",
			payload: { type: "TEXT", to: conversation.contactId, text: "Oi! Como posso te ajudar?" },
			reason: "AGENT",
			now,
		};
	}
}


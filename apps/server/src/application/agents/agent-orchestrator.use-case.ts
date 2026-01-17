import type { AgentRepository } from "../../domain/repositories/agent-repository";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { SLAEvaluator } from "../../domain/services/sla-evaluator";
import type { DispatchIntent } from "../dispatch-gate/dispatch-intent";
import type { AgentPlaybook } from "./agent-playbook";

export class AgentOrchestratorUseCase {
	constructor(
		private readonly conversations: ConversationRepository,
		private readonly agents: AgentRepository,
		private readonly slaEvaluator: SLAEvaluator,
		private readonly playbook: AgentPlaybook,
	) {}

	async execute(params: {
		conversationId: string;
		now?: Date;
	}): Promise<{ agentId: string; intent: DispatchIntent } | null> {
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
			const intent = this.playbook.draft({
				agent: followUpAgent,
				conversation,
				reason: "FOLLOW_UP",
				now,
			});
			return intent ? { agentId: followUpAgent.id, intent } : null;
		}

		const sdr = onlineAgents.find((a) => a.purpose === "SDR");
		if (!sdr) return null;

		const intent = this.playbook.draft({
			agent: sdr,
			conversation,
			reason: "FIRST_CONTACT",
			now,
		});

		return intent ? { agentId: sdr.id, intent } : null;
	}
}

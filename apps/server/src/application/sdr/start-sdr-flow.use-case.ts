import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { LeadRepository } from "../../domain/repositories/lead-repository";
import type { AgentOrchestratorUseCase } from "../agents/agent-orchestrator.use-case";
import type { DispatchUseCase } from "../dispatch/dispatch.use-case";
import type { CreateLeadUseCase } from "./create-lead.use-case";
import type { OpenConversationForLeadUseCase } from "./open-conversation-for-lead.use-case";

export class StartSdrFlowUseCase {
	constructor(
		private readonly createLead: CreateLeadUseCase,
		private readonly openConversationForLead: OpenConversationForLeadUseCase,
		private readonly orchestrator: AgentOrchestratorUseCase,
		private readonly dispatch: DispatchUseCase,
		private readonly leads: LeadRepository,
		private readonly conversations: ConversationRepository,
	) {}

	async execute(params: {
		instanceId: string;
		contactId: string;
		campaignId?: string | null;
		name: string;
		email: string;
		phone: string;
		now?: Date;
	}): Promise<{
		leadId: string;
		conversationId: string;
		agentId?: string;
		dispatchStatus: "SKIPPED" | "BLOCKED" | "FAILED" | "SENT";
	}> {
		const now = params.now ?? new Date();

		const conversation = await this.openConversationForLead.execute({
			instanceId: params.instanceId,
			contactId: params.contactId,
			now,
		});

		const lead = await this.createLead.execute({
			tenantId: conversation.tenantId,
			campaignId: params.campaignId ?? null,
			name: params.name,
			email: params.email,
			phone: params.phone,
			now,
		});

		conversation.linkLead(lead.id);
		await this.conversations.save(conversation);

		const decision = await this.orchestrator.execute({
			conversationId: conversation.id,
			now,
		});

		if (!decision) {
			return {
				leadId: lead.id,
				conversationId: conversation.id,
				dispatchStatus: "SKIPPED",
			};
		}

		conversation.assign(decision.agentId);
		await this.conversations.save(conversation);

		const out = await this.dispatch.execute({
			instanceId: decision.intent.instanceId,
			conversationId: decision.intent.conversationId,
			intent: { source: "AGENT", reason: decision.intent.type },
			message: decision.intent.payload,
			now,
		});

		if (out.result.status === "SENT") {
			lead.changeStage("CONTACTED");
			await this.leads.save(lead);
		}

		return {
			leadId: lead.id,
			conversationId: conversation.id,
			agentId: decision.agentId,
			dispatchStatus: out.result.status,
		};
	}
}

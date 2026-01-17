import type { Conversation } from "../entities/conversation";
import type { Agent } from "../entities/agent";
import type { Instance } from "../entities/instance";

export interface AgentOrchestrationDecision {
	agentId?: string;
}

export interface AgentOrchestrationStrategy {
	decide(params: {
		conversation: Conversation;
		instance: Instance;
		availableAgents: readonly Agent[];
		now: Date;
	}): AgentOrchestrationDecision;
}


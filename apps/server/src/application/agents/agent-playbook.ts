import type { Agent } from "../../domain/entities/agent";
import type { Conversation } from "../../domain/entities/conversation";
import type { DispatchIntent } from "../dispatch-gate/dispatch-intent";

export interface AgentPlaybook {
	draft(params: {
		agent: Agent;
		conversation: Conversation;
		reason: "FIRST_CONTACT" | "FOLLOW_UP";
		now: Date;
	}): DispatchIntent | null;
}


import type { Agent } from "../../domain/entities/agent";
import type { Conversation } from "../../domain/entities/conversation";
import type { DispatchIntent } from "../dispatch-gate/dispatch-intent";
import type { AgentPlaybook } from "./agent-playbook";

export class DefaultAgentPlaybook implements AgentPlaybook {
	draft(params: {
		agent: Agent;
		conversation: Conversation;
		reason: "FIRST_CONTACT" | "FOLLOW_UP";
		now: Date;
	}): DispatchIntent | null {
		if (params.conversation.stage !== "LEAD") {
			return null;
		}

		if (params.reason === "FIRST_CONTACT") {
			if (params.conversation.lastOutboundAt !== null) {
				return null;
			}

			return {
				tenantId: params.conversation.tenantId,
				instanceId: params.conversation.instanceId,
				conversationId: params.conversation.id,
				type: "REPLY",
				payload: {
					type: "TEXT",
					to: params.conversation.contactId,
					text: "Oi! Vi seu contato e queria entender rapidinho sua necessidade. Pode me contar um pouco?",
				},
				reason: "AGENT",
				now: params.now,
			};
		}

		if (params.reason === "FOLLOW_UP") {
			return {
				tenantId: params.conversation.tenantId,
				instanceId: params.conversation.instanceId,
				conversationId: params.conversation.id,
				type: "FOLLOW_UP",
				payload: {
					type: "TEXT",
					to: params.conversation.contactId,
					text: "So confirmando se voce viu minha mensagem anterior. Quer que eu te ajude com alguma duvida?",
				},
				reason: "AGENT",
				now: params.now,
			};
		}

		return null;
	}
}


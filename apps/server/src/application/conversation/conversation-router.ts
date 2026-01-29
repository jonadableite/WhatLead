import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { Conversation } from "../../domain/entities/conversation";
import type { Instance } from "../../domain/entities/instance";
import type { AgentRepository } from "../../domain/repositories/agent-repository";
import { noneReplyIntent } from "./reply-intent";
import type { RoutingDecision } from "./routing-decision";

export class ConversationRouter {
	constructor(private readonly agents: AgentRepository) {}

	async route(params: {
		conversation: Conversation;
		instance: Instance;
		inboundEvent: NormalizedWhatsAppEvent;
	}): Promise<RoutingDecision> {
		if (params.inboundEvent.type !== "MESSAGE_RECEIVED" && params.inboundEvent.type !== "GROUP_MESSAGE_RECEIVED") {
			return {
				replyIntent: noneReplyIntent({
					conversationId: params.conversation.id,
					instanceId: params.instance.id,
					reason: "AUTO_REPLY",
				}),
			};
		}

		if (params.instance.purpose === "WARMUP") {
			return {
				markWaiting: true,
				replyIntent: noneReplyIntent({
					conversationId: params.conversation.id,
					instanceId: params.instance.id,
					reason: "AUTO_REPLY",
				}),
			};
		}

		if (params.conversation.assignedAgentId || params.conversation.assignedOperatorId) {
			return {
				replyIntent: noneReplyIntent({
					conversationId: params.conversation.id,
					instanceId: params.instance.id,
					reason: "AUTO_REPLY",
				}),
			};
		}

		if (params.conversation.stage !== "LEAD") {
			return {
				markWaiting: true,
				replyIntent: noneReplyIntent({
					conversationId: params.conversation.id,
					instanceId: params.instance.id,
					reason: "AUTO_REPLY",
				}),
			};
		}

		const agents = await this.agents.listOnlineByOrganization({
			organizationId: params.conversation.tenantId,
		});
		const sdr = agents.find((a) => a.role === "SDR");
		if (!sdr) {
			const shouldAck = params.conversation.lastOutboundAt === null;
			return {
				markWaiting: true,
				replyIntent: shouldAck
					? {
							conversationId: params.conversation.id,
							instanceId: params.instance.id,
							type: "TEXT",
							reason: "AUTO_REPLY",
							payload: {
								to: params.conversation.contactId,
								text: "Recebemos sua mensagem. Em instantes um atendente vai falar com voce.",
							},
						}
					: noneReplyIntent({
							conversationId: params.conversation.id,
							instanceId: params.instance.id,
							reason: "AUTO_REPLY",
						}),
			};
		}

		return {
			assignAgentId: sdr.id,
			replyIntent: noneReplyIntent({
				conversationId: params.conversation.id,
				instanceId: params.instance.id,
				reason: "AUTO_REPLY",
			}),
		};
	}
}

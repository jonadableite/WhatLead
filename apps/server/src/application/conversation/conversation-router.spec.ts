import { describe, expect, it } from "vitest";
import { ConversationRouter } from "./conversation-router";
import { Agent } from "../../domain/entities/agent";
import { InMemoryAgentRepository } from "../../infra/repositories/in-memory-agent-repository";
import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";
import { Conversation } from "../../domain/entities/conversation";

describe("ConversationRouter", () => {
	it("does not assign SDR for WARMUP instances", async () => {
		const router = new ConversationRouter(
			new InMemoryAgentRepository([
				Agent.create({ id: "a-1", organizationId: "t-1", role: "SDR", status: "ONLINE" }),
			]),
		);

		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "t-1",
			engine: "TURBOZAP",
			reputation: rep,
			purpose: "WARMUP",
		});

		const conversation = Conversation.open({
			id: "c-1",
			tenantId: "t-1",
			channel: "WHATSAPP",
			instanceId: "i-1",
			contactId: "p-1",
			openedAt: new Date(),
		});

		const decision = await router.route({
			conversation,
			instance,
			inboundEvent: {
				type: "MESSAGE_RECEIVED",
				source: "WEBHOOK",
				instanceId: "i-1",
				occurredAt: new Date(),
				remoteJid: "p-1",
				isGroup: false,
				metadata: {},
			},
		});

		expect(decision.assignAgentId).toBeUndefined();
		expect(decision.markWaiting).toBe(true);
		expect(decision.replyIntent.type).toBe("NONE");
	});
});

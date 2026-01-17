import { describe, expect, it } from "vitest";
import { InMemoryConversationRepository } from "../../infra/repositories/in-memory-conversation-repository";
import { InMemoryLeadRepository } from "../../infra/repositories/in-memory-lead-repository";
import { Conversation } from "../../domain/entities/conversation";
import { Lead } from "../../domain/entities/lead";
import { UpdateLeadOnInboundUseCase } from "./update-lead-on-inbound.use-case";

describe("UpdateLeadOnInboundUseCase", () => {
	it("moves lead to QUALIFIED on inbound reply", async () => {
		const leads = new InMemoryLeadRepository();
		const conversations = new InMemoryConversationRepository();

		const lead = Lead.create({
			id: "l-1",
			tenantId: "t-1",
			campaignId: null,
			name: "Fulano",
			email: "f@x.com",
			phone: "p-1",
			stage: "NEW",
		});
		await leads.save(lead);

		const conversation = Conversation.open({
			id: "c-1",
			tenantId: "t-1",
			channel: "WHATSAPP",
			instanceId: "i-1",
			contactId: "p-1",
			openedAt: new Date("2026-01-16T00:00:00.000Z"),
		});
		conversation.linkLead("l-1");
		await conversations.save(conversation);

		const useCase = new UpdateLeadOnInboundUseCase(conversations, leads);
		await useCase.execute({
			conversationId: "c-1",
			event: {
				type: "MESSAGE_RECEIVED",
				source: "WEBHOOK",
				instanceId: "i-1",
				occurredAt: new Date("2026-01-16T00:01:00.000Z"),
				remoteJid: "p-1",
				isGroup: false,
				metadata: { messageType: "text", text: "oi" },
				messageId: "pm-1",
			} as any,
		});

		const updated = await leads.findById({ id: "l-1" });
		expect(updated?.stage).toBe("QUALIFIED");
	});
});


import { describe, expect, it, vi } from "vitest";
import { InMemoryConversationRepository } from "../../infra/repositories/in-memory-conversation-repository";
import { InMemoryLeadRepository } from "../../infra/repositories/in-memory-lead-repository";
import { InMemoryMessageRepository } from "../../infra/repositories/in-memory-message-repository";
import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import { ConversationEngineUseCase } from "../conversations/conversation-engine.use-case";
import { InboundMessageUseCase } from "./inbound-message.use-case";

describe("InboundMessageUseCase", () => {
	it("creates conversation on first inbound and increments unread", async () => {
		const conversations = new InMemoryConversationRepository();
		const leads = new InMemoryLeadRepository();
		const messages = new InMemoryMessageRepository();
		const instanceRepository = {
			findById: vi.fn(async () => ({ id: "i-1", companyId: "t-1" })),
		};
		const eventBus = { publish: vi.fn() };
		const idFactory = {
			createId: (() => {
				let i = 0;
				return () => `id-${++i}`;
			})(),
		};

		const engine = new ConversationEngineUseCase({
			instanceRepository: instanceRepository as any,
			conversationRepository: conversations,
			messageRepository: messages,
			idFactory,
			eventBus: eventBus as any,
		});
		const useCase = new InboundMessageUseCase({
			instanceRepository: instanceRepository as any,
			conversationEngine: engine,
			leadRepository: leads,
			idFactory,
		});

		const event: NormalizedWhatsAppEvent = {
			type: "MESSAGE_RECEIVED",
			source: "WEBHOOK",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T00:00:00.000Z"),
			messageId: "pm-1",
			remoteJid: "5511999999999",
			isGroup: false,
			metadata: { messageType: "text", text: "oi" },
		};

		const res = await useCase.execute(event);
		expect(res).not.toBeNull();

		const conversation = await conversations.findActiveByInstanceAndContact({
			instanceId: "i-1",
			contactId: "5511999999999",
		});

		expect(conversation).not.toBeNull();
		expect(conversation?.unreadCount).toBe(1);
		expect(await messages.existsByProviderMessageId({
			conversationId: conversation!.id,
			providerMessageId: "pm-1",
		})).toBe(true);
	});
});

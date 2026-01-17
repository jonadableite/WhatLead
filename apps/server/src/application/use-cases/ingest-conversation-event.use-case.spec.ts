import { describe, expect, it, vi } from "vitest";
import { IngestConversationEventUseCase } from "./ingest-conversation-event.use-case";
import { InMemoryConversationRepository } from "../../infra/repositories/in-memory-conversation-repository";
import { InMemoryMessageRepository } from "../../infra/repositories/in-memory-message-repository";
import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";

describe("IngestConversationEventUseCase", () => {
	it("creates conversation on first inbound and appends message", async () => {
		const conversationRepository = new InMemoryConversationRepository();
		const messageRepository = new InMemoryMessageRepository();
		const instanceRepository = {
			findById: vi.fn(async () => ({ id: "i-1", companyId: "t-1" })),
		};
		const idFactory = {
			createId: (() => {
				let i = 0;
				return () => `id-${++i}`;
			})(),
		};

		const useCase = new IngestConversationEventUseCase({
			instanceRepository: instanceRepository as any,
			conversationRepository,
			messageRepository,
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

		await useCase.execute(event);

		const conversation = await conversationRepository.findActiveByInstanceAndContact({
			instanceId: "i-1",
			contactId: "5511999999999",
		});

		expect(conversation).not.toBeNull();
		expect(conversation?.tenantId).toBe("t-1");
		expect(await messageRepository.existsByProviderMessageId({
			conversationId: conversation!.id,
			providerMessageId: "pm-1",
		})).toBe(true);
	});

	it("does not create conversation for outbound when none exists", async () => {
		const conversationRepository = new InMemoryConversationRepository();
		const messageRepository = new InMemoryMessageRepository();
		const instanceRepository = {
			findById: vi.fn(async () => ({ id: "i-1", companyId: "t-1" })),
		};
		const idFactory = { createId: () => "id-1" };

		const useCase = new IngestConversationEventUseCase({
			instanceRepository: instanceRepository as any,
			conversationRepository,
			messageRepository,
			idFactory,
		});

		await useCase.execute({
			type: "MESSAGE_SENT",
			source: "WEBHOOK",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T00:00:00.000Z"),
			messageId: "pm-1",
			remoteJid: "5511999999999",
			isGroup: false,
			metadata: { messageType: "text" },
		});

		const conversation = await conversationRepository.findActiveByInstanceAndContact({
			instanceId: "i-1",
			contactId: "5511999999999",
		});
		expect(conversation).toBeNull();
	});
});


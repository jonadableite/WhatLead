import { describe, expect, it, vi } from "vitest";
import { ReplyIntentDispatcher } from "./reply-intent-dispatcher";

describe("ReplyIntentDispatcher", () => {
	it("does nothing for NONE", async () => {
		const dispatch = { execute: vi.fn() };
		const dispatcher = new ReplyIntentDispatcher(
			dispatch as any,
			{ findById: vi.fn() } as any,
			{ findById: vi.fn() } as any,
		);

		await dispatcher.execute({
			conversationId: "c-1",
			instanceId: "i-1",
			type: "NONE",
			reason: "AUTO_REPLY",
		});

		expect(dispatch.execute).not.toHaveBeenCalled();
	});

	it("treats BLOCKED as no-op", async () => {
		const dispatch = {
			execute: vi.fn(async () => ({
				decision: { allowed: false, reason: "RATE_LIMIT", maxMessages: 0, minIntervalSeconds: 60, allowedMessageTypes: [] },
				result: { status: "BLOCKED", reason: "RATE_LIMIT" },
			})),
		};
		const dispatcher = new ReplyIntentDispatcher(
			dispatch as any,
			{
				findById: vi.fn(async () => ({
					id: "c-1",
					tenantId: "t-1",
					channel: "WHATSAPP",
					instanceId: "i-1",
					contactId: "p-1",
					leadId: null,
					status: "OPEN",
					stage: "LEAD",
					assignedAgentId: null,
					assignedOperatorId: null,
					openedAt: new Date(),
					lastMessageAt: new Date(),
					lastInboundAt: null,
					lastOutboundAt: null,
					unreadCount: 0,
					metadata: {},
					sla: null,
					isActive: true,
				})),
			} as any,
			{ findById: vi.fn(async () => null) } as any,
		);

		await dispatcher.execute({
			conversationId: "c-1",
			instanceId: "i-1",
			type: "TEXT",
			reason: "AUTO_REPLY",
			payload: { to: "p-1", text: "ok" },
		});

		expect(dispatch.execute).toHaveBeenCalledTimes(1);
	});
});


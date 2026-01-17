import { describe, expect, it } from "vitest";
import { Conversation } from "./conversation";

describe("Conversation", () => {
	it("tracks inbound/outbound timestamps and unread count", () => {
		const openedAt = new Date("2026-01-16T00:00:00.000Z");
		const conversation = Conversation.open({
			id: "c-1",
			tenantId: "t-1",
			channel: "WHATSAPP",
			instanceId: "i-1",
			contactId: "p-1",
			openedAt,
		});

		expect(conversation.unreadCount).toBe(0);
		expect(conversation.lastInboundAt).toBeNull();
		expect(conversation.lastOutboundAt).toBeNull();

		const inboundAt = new Date("2026-01-16T00:01:00.000Z");
		conversation.receiveInboundMessage({
			messageId: "m-1",
			type: "TEXT",
			occurredAt: inboundAt,
			contentRef: "oi",
		});

		expect(conversation.unreadCount).toBe(1);
		expect(conversation.lastInboundAt?.toISOString()).toBe(inboundAt.toISOString());
		expect(conversation.lastMessageAt.toISOString()).toBe(inboundAt.toISOString());
		expect(conversation.sla?.firstResponseDueAt).not.toBeNull();

		const outboundAt = new Date("2026-01-16T00:02:00.000Z");
		conversation.recordOutboundMessage({
			messageId: "m-2",
			type: "TEXT",
			sentBy: "BOT",
			occurredAt: outboundAt,
			contentRef: "ok",
		});

		expect(conversation.unreadCount).toBe(0);
		expect(conversation.lastOutboundAt?.toISOString()).toBe(outboundAt.toISOString());
		expect(conversation.lastMessageAt.toISOString()).toBe(outboundAt.toISOString());
		expect(conversation.sla).toBeNull();
	});
});

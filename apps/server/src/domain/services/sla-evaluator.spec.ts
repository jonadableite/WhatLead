import { describe, expect, it } from "vitest";
import { Conversation } from "../entities/conversation";
import { SLAEvaluator } from "./sla-evaluator";

describe("SLAEvaluator", () => {
	it("returns OK when there is no SLA", () => {
		const c = Conversation.open({
			id: "c-1",
			tenantId: "t-1",
			channel: "WHATSAPP",
			instanceId: "i-1",
			contactId: "p-1",
			openedAt: new Date("2026-01-16T00:00:00.000Z"),
		});

		const evalr = new SLAEvaluator();
		expect(evalr.evaluate(c, new Date("2026-01-16T00:00:00.000Z"))).toBe("OK");
	});

	it("returns DUE_SOON then BREACHED when dueAt passes", () => {
		const openedAt = new Date("2026-01-16T00:00:00.000Z");
		const c = Conversation.open({
			id: "c-1",
			tenantId: "t-1",
			channel: "WHATSAPP",
			instanceId: "i-1",
			contactId: "p-1",
			openedAt,
		});

		const inboundAt = new Date("2026-01-16T00:01:00.000Z");
		c.receiveInboundMessage({
			messageId: "m-1",
			type: "TEXT",
			occurredAt: inboundAt,
		});

		const dueAt = c.sla!.firstResponseDueAt!;
		const evalr = new SLAEvaluator(5 * 60 * 1000);

		expect(evalr.evaluate(c, new Date(dueAt.getTime() - 60 * 1000))).toBe("DUE_SOON");
		expect(evalr.evaluate(c, new Date(dueAt.getTime() + 1))).toBe("BREACHED");
	});
});


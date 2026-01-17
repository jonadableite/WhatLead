import { describe, expect, it, vi } from "vitest";
import { WhatsAppWebhookApplicationHandler } from "./whatsapp-webhook.handler";

describe("WhatsAppWebhookApplicationHandler", () => {
	it("delegates to IngestReputationSignalUseCase", async () => {
		const ingestSignal = {
			execute: vi.fn(async () => {}),
		};

		const handler = new WhatsAppWebhookApplicationHandler(ingestSignal as any);

		const occurredAt = new Date("2026-01-16T00:00:00.000Z");
		const event = {
			type: "MESSAGE_RECEIVED",
			instanceId: "i-1",
			occurredAt,
			isGroup: false,
			metadata: {},
		} as const;
		await handler.handle(event);

		expect(ingestSignal.execute).toHaveBeenCalledWith(event);
	});
});

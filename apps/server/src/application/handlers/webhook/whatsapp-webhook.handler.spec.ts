import { describe, expect, it, vi } from "vitest";
import { WhatsAppWebhookApplicationHandler } from "./whatsapp-webhook.handler";

describe("WhatsAppWebhookApplicationHandler", () => {
	it("records metrics and evaluates instance health with reason WEBHOOK", async () => {
		const metricIngestion = {
			record: vi.fn(async () => {}),
			recordMany: vi.fn(async () => {}),
		};

		const evaluateInstanceHealth = {
			execute: vi.fn(async () => ({
				status: { lifecycle: "ACTIVE", connection: "CONNECTED" },
				reputationScore: 50,
				temperatureLevel: "COLD",
				riskLevel: "LOW",
				alerts: [],
				actions: ["ALLOW_DISPATCH"],
			})),
		};

		const handler = new WhatsAppWebhookApplicationHandler(
			metricIngestion,
			evaluateInstanceHealth as any,
		);

		const occurredAt = new Date("2026-01-16T00:00:00.000Z");
		await handler.handle({
			type: "MESSAGE_RECEIVED",
			instanceId: "i-1",
			occurredAt,
			isGroup: false,
			metadata: {},
		});

		expect(metricIngestion.record).toHaveBeenCalledTimes(1);
		expect(evaluateInstanceHealth.execute).toHaveBeenCalledWith({
			instanceId: "i-1",
			reason: "WEBHOOK",
			now: occurredAt,
		});
	});
});


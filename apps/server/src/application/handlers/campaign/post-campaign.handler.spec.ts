import { describe, expect, it, vi } from "vitest";
import { PostCampaignHandler } from "./post-campaign.handler";

describe("PostCampaignHandler", () => {
	it("evaluates instance health with reason POST_CAMPAIGN", async () => {
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

		const handler = new PostCampaignHandler(evaluateInstanceHealth as any);
		const now = new Date("2026-01-16T00:00:00.000Z");
		await handler.handle("i-1", now);

		expect(evaluateInstanceHealth.execute).toHaveBeenCalledWith({
			instanceId: "i-1",
			reason: "POST_CAMPAIGN",
			now,
		});
	});
});


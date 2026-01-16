import { describe, expect, it, vi } from "vitest";
import { InstanceHealthCronJob } from "./instance-health.cron";

describe("InstanceHealthCronJob", () => {
	it("evaluates health for each active instance with reason CRON", async () => {
		const activeInstanceIds = {
			list: vi.fn(async () => ["i-1", "i-2"]),
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

		const cron = new InstanceHealthCronJob(
			activeInstanceIds,
			evaluateInstanceHealth as any,
		);

		const now = new Date("2026-01-16T00:00:00.000Z");
		await cron.run(now);

		expect(activeInstanceIds.list).toHaveBeenCalledTimes(1);
		expect(evaluateInstanceHealth.execute).toHaveBeenNthCalledWith(1, {
			instanceId: "i-1",
			reason: "CRON",
			now,
		});
		expect(evaluateInstanceHealth.execute).toHaveBeenNthCalledWith(2, {
			instanceId: "i-2",
			reason: "CRON",
			now,
		});
	});
});


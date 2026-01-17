import { describe, expect, it } from "vitest";
import { WarmupPlanFactory } from "./warmup-plan-factory";

describe("WarmupPlanFactory", () => {
	it("returns null when health blocks dispatch", () => {
		const plan = WarmupPlanFactory.fromHealth({
			instanceId: "i-1",
			health: {
				status: { lifecycle: "ACTIVE", connection: "CONNECTED" },
				reputationScore: 50,
				temperatureLevel: "COLD",
				riskLevel: "LOW",
				alerts: [],
				actions: ["BLOCK_DISPATCH"],
				warmUpPhase: "NEWBORN",
				cooldownReason: null,
				signalsSnapshot: {} as any,
			},
		});

		expect(plan).toBeNull();
	});

	it("maps warmUpPhase to BOOT", () => {
		const plan = WarmupPlanFactory.fromHealth({
			instanceId: "i-1",
			health: {
				status: { lifecycle: "ACTIVE", connection: "CONNECTED" },
				reputationScore: 50,
				temperatureLevel: "COLD",
				riskLevel: "LOW",
				alerts: [],
				actions: ["ALLOW_DISPATCH"],
				warmUpPhase: "NEWBORN",
				cooldownReason: null,
				signalsSnapshot: {} as any,
			},
		});

		expect(plan?.phase).toBe("BOOT");
	});
});


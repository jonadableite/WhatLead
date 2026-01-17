import { describe, expect, it, vi } from "vitest";
import { HeaterUseCase } from "./heater.use-case";
import { GuardedDispatchPort } from "./guarded-dispatch-port";

describe("HeaterUseCase (dispatch gate)", () => {
	it("does not send when dispatch gate blocks", async () => {
		const instance = {
			id: "i-1",
			reputation: { currentWarmUpPhase: () => "OBSERVER" },
		};

		const instanceRepository = {
			findById: vi.fn(async () => instance),
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

		const warmUpStrategy = {
			plan: vi.fn(async () => ({
				actions: [{ type: "SEND_TEXT", instanceId: "i-1", to: "t", text: "x" }],
			})),
		};

		const innerDispatchPort = {
			send: vi.fn(),
		};
		const guard = {
			ensureCanDispatch: vi.fn(async () => {
				throw new Error("blocked");
			}),
		};
		const dispatchPort = new GuardedDispatchPort(innerDispatchPort as any, guard as any);

		const metricIngestion = {
			recordMany: vi.fn(),
		};

		const heater = new HeaterUseCase(
			instanceRepository as any,
			evaluateInstanceHealth as any,
			warmUpStrategy as any,
			dispatchPort as any,
			metricIngestion as any,
		);

		await expect(heater.execute("i-1")).resolves.toBeUndefined();
		expect(innerDispatchPort.send).not.toHaveBeenCalled();
	});
});

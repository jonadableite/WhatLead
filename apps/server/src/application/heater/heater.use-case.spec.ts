import { describe, expect, it, vi } from "vitest";
import { HeaterUseCase } from "./heater.use-case";

describe("HeaterUseCase", () => {
	it("does nothing when health does not allow dispatch", async () => {
		const instanceRepository = {
			findById: vi.fn(async () => null),
			save: vi.fn(async () => {}),
		};

		const evaluateInstanceHealth = {
			execute: vi.fn(async () => ({
				status: { lifecycle: "ACTIVE", connection: "CONNECTED" },
				reputationScore: 50,
				temperatureLevel: "COLD",
				riskLevel: "LOW",
				alerts: [],
				actions: ["BLOCK_DISPATCH"],
			})),
		};

		const warmUpStrategy = {
			plan: vi.fn(async () => ({ actions: [] })),
		};

		const dispatchPort = {
			send: vi.fn(async () => ({ success: true, producedEvents: [] })),
		};

		const metricIngestion = {
			record: vi.fn(async () => {}),
			recordMany: vi.fn(async () => {}),
		};

		const heater = new HeaterUseCase(
			instanceRepository as any,
			evaluateInstanceHealth as any,
			warmUpStrategy as any,
			dispatchPort as any,
			metricIngestion as any,
		);

		await heater.execute("i-1");

		expect(evaluateInstanceHealth.execute).toHaveBeenCalledTimes(1);
		expect(warmUpStrategy.plan).not.toHaveBeenCalled();
		expect(dispatchPort.send).not.toHaveBeenCalled();
	});

	it("dispatches all plan actions when health allows dispatch", async () => {
		const instance = {
			id: "i-1",
			reputation: {
				currentWarmUpPhase: () => "OBSERVER",
			},
		};

		const instanceRepository = {
			findById: vi.fn(async () => instance),
			save: vi.fn(async () => {}),
		};

		const evaluateInstanceHealth = {
			execute: vi.fn().mockResolvedValueOnce({
				status: { lifecycle: "ACTIVE", connection: "CONNECTED" },
				reputationScore: 50,
				temperatureLevel: "COLD",
				riskLevel: "LOW",
				alerts: [],
				actions: ["ALLOW_DISPATCH"],
			}),
		};

		const warmUpStrategy = {
			plan: vi.fn(async () => ({
				actions: [
					{ type: "SEND_TEXT", instanceId: "i-1", to: "t", text: "kkk" },
					{ type: "SEND_TEXT", instanceId: "i-1", to: "t", text: "boa" },
				],
			})),
		};

		const producedEvent = {
			type: "MESSAGE_SENT",
			source: "DISPATCH",
			instanceId: "i-1",
			occurredAt: new Date(),
			isGroup: false,
			metadata: {},
		};

		const dispatchPort = {
			send: vi.fn(async () => ({ success: true, producedEvents: [producedEvent] })),
		};

		const metricIngestion = {
			record: vi.fn(async () => {}),
			recordMany: vi.fn(async () => {}),
		};

		const heater = new HeaterUseCase(
			instanceRepository as any,
			evaluateInstanceHealth as any,
			warmUpStrategy as any,
			dispatchPort as any,
			metricIngestion as any,
		);

		await heater.execute("i-1", new Date("2026-01-16T00:00:00.000Z"));

		expect(warmUpStrategy.plan).toHaveBeenCalledTimes(1);
		expect(warmUpStrategy.plan).toHaveBeenCalledWith(
			expect.objectContaining({
				instance,
				phase: "OBSERVER",
			}),
		);
		expect(dispatchPort.send).toHaveBeenCalledTimes(2);
		expect(metricIngestion.recordMany).toHaveBeenCalledTimes(2);
		expect(metricIngestion.recordMany).toHaveBeenCalledWith([producedEvent]);
	});
});

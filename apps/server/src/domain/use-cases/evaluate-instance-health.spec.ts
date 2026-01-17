import { describe, expect, it, vi } from "vitest";
import { Instance } from "../entities/instance";
import { InstanceReputation } from "../entities/instance-reputation";
import { EvaluateInstanceHealthUseCase } from "./evaluate-instance-health";

describe("EvaluateInstanceHealthUseCase", () => {
	it("enters cooldown and publishes InstanceEnteredCooldown", async () => {
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation: InstanceReputation.initialize("i-1"),
			purpose: "MIXED",
		});
		instance.markConnected();

		const instanceRepository = {
			findById: vi.fn(async () => instance),
			save: vi.fn(async () => {}),
		};

		const reputationRepository = {
			findByInstanceId: vi.fn(async () => null),
			save: vi.fn(async () => {}),
		};

		const signals = {
			messagesSent: 100,
			messagesDelivered: 90,
			messagesRead: 0,
			messagesReplied: 0,
			reactionsSent: 0,
			messagesBlocked: 1,
			humanInteractions: 0,
			groupInteractions: 0,
			mediaMessages: 0,
			textMessages: 100,
			averageReplyTimeInSeconds: 0,
			averageDeliveryLatencyMs: 0,
			deliveryFailures: 0,
			reactionsReceived: 0,
			connectionDisconnects: 0,
			qrcodeRegenerations: 0,
			presenceSets: 0,
			rateLimitHits: 0,
		} as const;

		const metricRepository = {
			getRecentSignals: vi.fn(async () => signals),
		};

		const evaluator = {
			evaluate: vi.fn((rep: InstanceReputation) => {
				rep.enterCooldown("BLOCK_SPIKE");
				return rep;
			}),
		};

		const eventBus = {
			publish: vi.fn(),
			publishMany: vi.fn(),
		};

		const useCase = new EvaluateInstanceHealthUseCase(
			instanceRepository,
			reputationRepository,
			metricRepository,
			evaluator,
			eventBus,
		);

		const now = new Date("2026-01-16T00:00:00.000Z");
		const result = await useCase.execute({
			instanceId: "i-1",
			reason: "WEBHOOK",
			now,
		});

		expect(result.status.lifecycle).toBe("COOLDOWN");
		expect(result.actions).toContain("ENTER_COOLDOWN");
		expect(result.actions).toContain("BLOCK_DISPATCH");

		expect(eventBus.publishMany).toHaveBeenCalledTimes(1);
		expect(eventBus.publishMany).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					type: "InstanceEnteredCooldown",
					instanceId: "i-1",
					companyId: "c-1",
					reason: "WEBHOOK",
				}),
			]),
		);
	});

	it("allows dispatch when healthy and connected", async () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(80, "HOT", "UP", [], rep.signals);

		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation: rep,
			purpose: "MIXED",
		});
		instance.markConnected();

		const instanceRepository = {
			findById: vi.fn(async () => instance),
			save: vi.fn(async () => {}),
		};

		const reputationRepository = {
			findByInstanceId: vi.fn(async () => rep),
			save: vi.fn(async () => {}),
		};

		const signals = {
			messagesSent: 10,
			messagesDelivered: 10,
			messagesRead: 0,
			messagesReplied: 5,
			reactionsSent: 0,
			messagesBlocked: 0,
			humanInteractions: 1,
			groupInteractions: 0,
			mediaMessages: 1,
			textMessages: 9,
			averageReplyTimeInSeconds: 10,
			averageDeliveryLatencyMs: 0,
			deliveryFailures: 0,
			reactionsReceived: 0,
			connectionDisconnects: 0,
			qrcodeRegenerations: 0,
			presenceSets: 0,
			rateLimitHits: 0,
		} as const;

		const metricRepository = {
			getRecentSignals: vi.fn(async () => signals),
		};

		const evaluator = {
			evaluate: vi.fn((r: InstanceReputation) => {
				r.applyEvaluation(80, "HOT", "UP", [], signals);
				return r;
			}),
		};

		const eventBus = {
			publish: vi.fn(),
			publishMany: vi.fn(),
		};

		const useCase = new EvaluateInstanceHealthUseCase(
			instanceRepository,
			reputationRepository,
			metricRepository,
			evaluator,
			eventBus,
		);

		const result = await useCase.execute({
			instanceId: "i-1",
			reason: "PRE_DISPATCH",
		});

		expect(result.status.lifecycle).toBe("ACTIVE");
		expect(result.status.connection).toBe("CONNECTED");
		expect(result.actions).toContain("ALLOW_DISPATCH");
		expect(eventBus.publishMany).toHaveBeenCalledTimes(1);
		expect(eventBus.publishMany).toHaveBeenCalledWith([]);
	});
});

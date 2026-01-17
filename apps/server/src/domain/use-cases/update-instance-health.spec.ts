import { describe, expect, it, vi } from "vitest";
import { Instance } from "../entities/instance";
import { InstanceReputation } from "../entities/instance-reputation";
import { UpdateInstanceHealthUseCase } from "./update-instance-health";

describe("UpdateInstanceHealthUseCase", () => {
	it("emits InstanceEnteredCooldown when reputation requires cooldown", async () => {
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
		};

		const metricRepository = {
			getRecentSignals: vi.fn(async () => signals),
		};

		const evaluator = {
			evaluate: vi.fn((rep: InstanceReputation) => {
				rep.enterCooldown("BLOCK_SPIKE");
				return rep;
			}),
		};

		const useCase = new UpdateInstanceHealthUseCase(
			instanceRepository,
			reputationRepository,
			metricRepository,
			evaluator,
		);

		const now = new Date("2026-01-16T00:00:00.000Z");
		const result = await useCase.execute({
			companyId: "c-1",
			instanceId: "i-1",
			now,
		});

		expect(result.lifecycleStatus).toBe("COOLDOWN");
		expect(result.events).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: "InstanceEnteredCooldown" }),
			]),
		);
		expect(instanceRepository.save).toHaveBeenCalledTimes(1);
		expect(reputationRepository.save).toHaveBeenCalledTimes(1);
	});

	it("emits InstanceRecovered when leaving cooldown and no longer at risk", async () => {
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
		instance.enterCooldown();

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
		};

		const metricRepository = {
			getRecentSignals: vi.fn(async () => signals),
		};

		const evaluator = {
			evaluate: vi.fn((r: InstanceReputation) => {
				r.applyEvaluation(80, "HOT", "UP", [], signals);
				return r;
			}),
		};

		const useCase = new UpdateInstanceHealthUseCase(
			instanceRepository,
			reputationRepository,
			metricRepository,
			evaluator,
		);

		const now = new Date("2026-01-16T00:00:00.000Z");
		const result = await useCase.execute({
			companyId: "c-1",
			instanceId: "i-1",
			now,
		});

		expect(result.lifecycleStatus).toBe("ACTIVE");
		expect(result.events).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: "InstanceRecovered" }),
			]),
		);
	});
});

import { describe, expect, it, vi } from "vitest";
import { InstanceReputation } from "../entities/instance-reputation";
import { EvaluateInstanceReputationUseCase } from "./evaluate-instance-reputation";

describe("EvaluateInstanceReputationUseCase", () => {
	it("initializes reputation when repository returns null", async () => {
		const reputationRepository = {
			findByInstanceId: vi.fn(async () => null),
			save: vi.fn(async () => {}),
		};

		const signals = {
			messagesSent: 0,
			messagesDelivered: 0,
			messagesReplied: 0,
			messagesBlocked: 0,
			humanInteractions: 0,
			groupInteractions: 0,
			mediaMessages: 0,
			textMessages: 0,
			averageReplyTimeInSeconds: 0,
			deliveryFailures: 0,
			reactionsReceived: 0,
		} as const;

		const metricRepository = {
			getRecentSignals: vi.fn(async () => signals),
		};

		const evaluator = {
			evaluate: vi.fn((reputation: InstanceReputation) => reputation),
		};

		const useCase = new EvaluateInstanceReputationUseCase(
			reputationRepository,
			metricRepository,
			evaluator,
		);

		const result = await useCase.execute({
			companyId: "c-1",
			instanceId: "i-1",
		});

		expect(reputationRepository.findByInstanceId).toHaveBeenCalledWith("i-1");
		expect(metricRepository.getRecentSignals).toHaveBeenCalledWith("i-1");
		expect(evaluator.evaluate).toHaveBeenCalledTimes(1);
		expect(reputationRepository.save).toHaveBeenCalledTimes(1);
		expect(result.reputationScore).toBe(50);
		expect(result.temperatureLevel).toBe("COLD");
		expect(result.canDispatch).toBe(true);
	});

	it("uses existing reputation when found", async () => {
		const existing = InstanceReputation.initialize("i-1");

		const reputationRepository = {
			findByInstanceId: vi.fn(async () => existing),
			save: vi.fn(async () => {}),
		};

		const signals = {
			messagesSent: 100,
			messagesDelivered: 95,
			messagesReplied: 20,
			messagesBlocked: 0,
			humanInteractions: 1,
			groupInteractions: 0,
			mediaMessages: 10,
			textMessages: 90,
			averageReplyTimeInSeconds: 15,
			deliveryFailures: 0,
			reactionsReceived: 1,
		} as const;

		const metricRepository = {
			getRecentSignals: vi.fn(async () => signals),
		};

		const updated = InstanceReputation.reconstitute({
			instanceId: "i-1",
			score: 80,
			temperatureLevel: "HOT",
			trend: "UP",
			alerts: [],
			signals: { ...signals },
			lastEvaluatedAt: new Date(),
			lastHumanInteractionAt: new Date(),
			cooldownCount: 0,
			cooldownReason: null,
			cooldownStartedAt: null,
		});

		const evaluator = {
			evaluate: vi.fn(() => updated),
		};

		const useCase = new EvaluateInstanceReputationUseCase(
			reputationRepository,
			metricRepository,
			evaluator,
		);

		const result = await useCase.execute({
			companyId: "c-1",
			instanceId: "i-1",
		});

		expect(evaluator.evaluate).toHaveBeenCalledWith(existing, signals);
		expect(reputationRepository.save).toHaveBeenCalledWith(updated);
		expect(result.reputationScore).toBe(80);
		expect(result.temperatureLevel).toBe("HOT");
		expect(result.riskLevel).toBe("low");
	});
});


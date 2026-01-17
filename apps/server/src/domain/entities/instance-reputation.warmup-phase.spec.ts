import { describe, expect, it } from "vitest";
import { InstanceReputation } from "./instance-reputation";
import { createAlert } from "../value-objects/reputation-alert";

describe("InstanceReputation.currentWarmUpPhase", () => {
	it("returns NEWBORN for a fresh reputation state", () => {
		const rep = InstanceReputation.initialize("i-1");
		expect(rep.currentWarmUpPhase()).toBe("NEWBORN");
	});

	it("returns OBSERVER when overheated", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(10, "OVERHEATED", "DOWN", [], rep.signals);
		expect(rep.currentWarmUpPhase()).toBe("OBSERVER");
	});

	it("returns NEWBORN when cooldown count is high", () => {
		const rep = InstanceReputation.reconstitute({
			instanceId: "i-1",
			score: 55,
			temperatureLevel: "COLD",
			trend: "STABLE",
			alerts: [],
			signals: repSignals(),
			lastEvaluatedAt: new Date(),
			lastHumanInteractionAt: null,
			cooldownCount: 3,
			cooldownReason: null,
			cooldownStartedAt: null,
		});
		expect(rep.currentWarmUpPhase()).toBe("NEWBORN");
	});

	it("returns OBSERVER when high/critical alerts exist", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(70, "HOT", "STABLE", [createAlert.blockDetected(1)], rep.signals);
		expect(rep.currentWarmUpPhase()).toBe("OBSERVER");
	});

	it("maps scores to phase buckets", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(54, "COLD", "STABLE", [], { ...rep.signals, humanInteractions: 1 });
		expect(rep.currentWarmUpPhase()).toBe("OBSERVER");

		rep.applyEvaluation(60, "WARM", "STABLE", [], { ...rep.signals, humanInteractions: 1 });
		expect(rep.currentWarmUpPhase()).toBe("INTERACTING");

		rep.applyEvaluation(84, "HOT", "STABLE", [], { ...rep.signals, humanInteractions: 1 });
		expect(rep.currentWarmUpPhase()).toBe("SOCIAL");

		rep.applyEvaluation(90, "HOT", "STABLE", [], { ...rep.signals, humanInteractions: 1 });
		expect(rep.currentWarmUpPhase()).toBe("READY");
	});
});

const repSignals = () => ({
	messagesSent: 0,
	messagesDelivered: 0,
	messagesRead: 0,
	messagesReplied: 0,
	reactionsSent: 0,
	messagesBlocked: 0,
	humanInteractions: 0,
	groupInteractions: 0,
	mediaMessages: 0,
	textMessages: 0,
	averageReplyTimeInSeconds: 0,
	averageDeliveryLatencyMs: 0,
	deliveryFailures: 0,
	reactionsReceived: 0,
	connectionDisconnects: 0,
	qrcodeRegenerations: 0,
	presenceSets: 0,
	rateLimitHits: 0,
});

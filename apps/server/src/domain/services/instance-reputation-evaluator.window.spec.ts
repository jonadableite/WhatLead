import { describe, expect, it } from "vitest";
import { InstanceReputation } from "../entities/instance-reputation";
import { InstanceReputationEvaluator } from "./instance-reputation-evaluator";

describe("InstanceReputationEvaluator (window inference)", () => {
	it("does not infer delivery drop when no delivery evidence exists", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(65, "WARM", "UP", [], rep.signals);

		const evaluator = new InstanceReputationEvaluator();
		evaluator.evaluate(rep, {
			messagesSent: 10,
			messagesDelivered: 0,
			messagesRead: 0,
			messagesReplied: 5,
			messagesBlocked: 0,
			humanInteractions: 0,
			groupInteractions: 0,
			mediaMessages: 0,
			textMessages: 10,
			averageReplyTimeInSeconds: 0,
			averageDeliveryLatencyMs: 0,
			deliveryFailures: 0,
			reactionsReceived: 0,
			connectionDisconnects: 0,
		});

		expect(rep.cooldownReason).toBeNull();
		expect(rep.alerts.some((a) => a.code === "DELIVERY_DROP")).toBe(false);
	});

	it("regresses warmup phase when delivery drop is inferred", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(65, "WARM", "UP", [], rep.signals);
		expect(rep.currentWarmUpPhase()).toBe("INTERACTING");

		const evaluator = new InstanceReputationEvaluator();
		evaluator.evaluate(rep, {
			messagesSent: 30,
			messagesDelivered: 5,
			messagesRead: 0,
			messagesReplied: 0,
			messagesBlocked: 0,
			humanInteractions: 0,
			groupInteractions: 0,
			mediaMessages: 0,
			textMessages: 30,
			averageReplyTimeInSeconds: 0,
			averageDeliveryLatencyMs: 0,
			deliveryFailures: 0,
			reactionsReceived: 0,
			connectionDisconnects: 0,
		});

		expect(rep.temperatureLevel).toBe("COOLDOWN");
		expect(rep.cooldownReason).toBe("DELIVERY_DROP");
		expect(rep.currentWarmUpPhase()).toBe("OBSERVER");
	});
});

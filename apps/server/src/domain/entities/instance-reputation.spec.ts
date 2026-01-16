import { describe, expect, it } from "vitest";
import { createAlert } from "../value-objects/reputation-alert";
import { InstanceReputation } from "./instance-reputation";

describe("InstanceReputation", () => {
	it("initializes with default values", () => {
		const rep = InstanceReputation.initialize("i-1");
		expect(rep.score).toBe(50);
		expect(rep.temperatureLevel).toBe("COLD");
		expect(rep.trend).toBe("STABLE");
		expect(rep.alerts).toEqual([]);
		expect(rep.cooldownCount).toBe(0);
		expect(rep.cooldownReason).toBeNull();
		expect(rep.cooldownStartedAt).toBeNull();
	});

	it("enters cooldown with reason and blocks dispatch", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.enterCooldown("BLOCK_SPIKE");

		expect(rep.temperatureLevel).toBe("COOLDOWN");
		expect(rep.cooldownCount).toBe(1);
		expect(rep.canDispatch()).toBe(false);
	});

	it("isAtRisk when critical alerts exist", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(rep.score, rep.temperatureLevel, rep.trend, [createAlert.blockDetected(1)], rep.signals);
		expect(rep.isAtRisk()).toBe(true);
		expect(rep.getRiskLevel()).toBe("medium");
	});

	it("requiresCooldown when score is too low", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(10, "COLD", "DOWN", [], rep.signals);
		expect(rep.requiresCooldown()).toBe(true);
	});

	it("does not allow dispatch when overheated", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.applyEvaluation(10, "OVERHEATED", "DOWN", [], rep.signals);
		expect(rep.canDispatch()).toBe(false);
	});

	it("auto exits cooldown on evaluation when score recovered", () => {
		const rep = InstanceReputation.initialize("i-1");
		rep.enterCooldown("BLOCK_SPIKE");
		expect(rep.temperatureLevel).toBe("COOLDOWN");

		rep.applyEvaluation(70, "COOLDOWN", "UP", [], rep.signals);
		expect(rep.temperatureLevel).toBe("COLD");
		expect(rep.cooldownReason).toBeNull();
	});
});

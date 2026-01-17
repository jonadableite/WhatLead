import { describe, expect, it, vi } from "vitest";
import { HumanLikeWarmUpStrategy } from "./human-like.strategy";

describe("HumanLikeWarmUpStrategy", () => {
	it("returns presence-only actions in NEWBORN/OBSERVER", async () => {
		const targets = { listTargets: vi.fn(async () => ["t-1"]) };
		const content = { randomText: vi.fn(() => "kkk") };
		const strategy = new HumanLikeWarmUpStrategy(targets as any, content as any);

		const instance = { id: "i-1", canWarmUp: () => true } as any;

		const newborn = await strategy.plan({
			instance,
			phase: "NEWBORN",
		});
		expect(newborn.actions).toEqual([
			{
				type: "SET_PRESENCE",
				instanceId: "i-1",
				to: "t-1",
				presence: "composing",
			},
		]);

		const observer = await strategy.plan({
			instance,
			phase: "OBSERVER",
		});
		expect(observer.actions[0]?.type).toBe("SET_PRESENCE");
	});

	it("returns a short text action in INTERACTING", async () => {
		const targets = { listTargets: vi.fn(async () => ["t-1"]) };
		const content = { randomText: vi.fn(() => "boa") };
		const strategy = new HumanLikeWarmUpStrategy(targets as any, content as any);

		const instance = { id: "i-1", canWarmUp: () => true } as any;
		const plan = await strategy.plan({ instance, phase: "INTERACTING" });

		expect(plan.actions).toEqual([
			{
				type: "SEND_TEXT",
				instanceId: "i-1",
				to: "t-1",
				text: "boa",
			},
		]);
	});
});


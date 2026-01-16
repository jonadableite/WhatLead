import { describe, expect, it, vi } from "vitest";
import { DispatchBlockedError, PreDispatchGuard } from "./pre-dispatch.guard";

describe("PreDispatchGuard", () => {
	it("throws DispatchBlockedError when use case returns BLOCK_DISPATCH", async () => {
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

		const guard = new PreDispatchGuard(evaluateInstanceHealth as any);

		await expect(guard.ensureCanDispatch("i-1")).rejects.toBeInstanceOf(
			DispatchBlockedError,
		);
	});

	it("does not throw when use case allows dispatch", async () => {
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

		const guard = new PreDispatchGuard(evaluateInstanceHealth as any);
		await expect(guard.ensureCanDispatch("i-1")).resolves.toBeUndefined();
	});
});


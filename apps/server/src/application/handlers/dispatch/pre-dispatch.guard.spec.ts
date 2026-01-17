import { describe, expect, it, vi } from "vitest";
import { DispatchBlockedError, PreDispatchGuard } from "./pre-dispatch.guard";

describe("PreDispatchGuard", () => {
	it("throws DispatchBlockedError when gate blocks", async () => {
		const gate = {
			execute: vi.fn(async () => ({ allowed: false, reason: "RATE_LIMIT" })),
		};

		const guard = new PreDispatchGuard(gate as any);

		await expect(
			guard.ensureCanDispatch({
				type: "SEND_TEXT",
				instanceId: "i-1",
				to: "t",
				text: "oi",
				delayMs: 0,
			} as any),
		).rejects.toBeInstanceOf(DispatchBlockedError);
	});

	it("does not throw when gate allows", async () => {
		const gate = {
			execute: vi.fn(async () => ({ allowed: true })),
		};

		const guard = new PreDispatchGuard(gate as any);
		await expect(
			guard.ensureCanDispatch({
				type: "SEND_TEXT",
				instanceId: "i-1",
				to: "t",
				text: "oi",
				delayMs: 0,
			} as any),
		).resolves.toBeUndefined();
	});
});

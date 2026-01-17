import { describe, expect, it, vi } from "vitest";
import { GuardedDispatchPort } from "./guarded-dispatch-port";

describe("GuardedDispatchPort", () => {
	it("calls PreDispatchGuard for SEND_TEXT and blocks when guard throws", async () => {
		const inner = {
			send: vi.fn(),
		};
		const guard = {
			ensureCanDispatch: vi.fn(async () => {
				throw new Error("blocked");
			}),
		};
		const port = new GuardedDispatchPort(inner as any, guard as any);

		await expect(
			port.send({
				type: "SEND_TEXT",
				instanceId: "i-1",
				to: "t",
				text: "x",
			}),
		).rejects.toThrow("blocked");

		expect(guard.ensureCanDispatch).toHaveBeenCalledWith("i-1");
		expect(inner.send).not.toHaveBeenCalled();
	});

	it("does not call PreDispatchGuard for SET_PRESENCE", async () => {
		const inner = {
			send: vi.fn(async () => ({ success: true })),
		};
		const guard = {
			ensureCanDispatch: vi.fn(),
		};
		const port = new GuardedDispatchPort(inner as any, guard as any);

		await expect(
			port.send({
				type: "SET_PRESENCE",
				instanceId: "i-1",
				to: "t",
				presence: "composing",
			}),
		).resolves.toMatchObject({ success: true });

		expect(guard.ensureCanDispatch).not.toHaveBeenCalled();
		expect(inner.send).toHaveBeenCalledTimes(1);
	});
});


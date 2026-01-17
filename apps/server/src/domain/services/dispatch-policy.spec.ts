import { describe, expect, it } from "vitest";
import { Instance } from "../entities/instance";
import { InstanceReputation } from "../entities/instance-reputation";
import { DispatchPolicy } from "./dispatch-policy";

describe("DispatchPolicy", () => {
	it("blocks when instance is not connected", () => {
		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation: rep,
		});

		const policy = new DispatchPolicy();
		const decision = policy.evaluate({
			instance,
			reputation: rep,
			intentSource: "WARMUP",
			messageType: "TEXT",
			now: new Date(),
		});

		expect(decision.allowed).toBe(false);
		expect((decision as any).reason).toBe("INSTANCE_NOT_ACTIVE");
	});

	it("blocks media in early warmup for warmup intent", () => {
		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const policy = new DispatchPolicy();
		const decision = policy.evaluate({
			instance,
			reputation: rep,
			intentSource: "WARMUP",
			messageType: "IMAGE",
			now: new Date(),
		});

		expect(decision.allowed).toBe(false);
		expect((decision as any).reason).toBe("UNSUPPORTED_MESSAGE_TYPE");
	});
});


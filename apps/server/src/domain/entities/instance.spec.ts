import { describe, expect, it } from "vitest";
import { Instance } from "./instance";
import { InstanceReputation } from "./instance-reputation";

describe("Instance", () => {
	it("initializes with CREATED status and WARMUP purpose by default", () => {
		const reputation = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation,
		});

		expect(instance.lifecycleStatus).toBe("CREATED");
		expect(instance.connectionStatus).toBe("DISCONNECTED");
		expect(instance.purpose).toBe("WARMUP");
		expect(instance.engine).toBe("TURBOZAP");
		expect(instance.companyId).toBe("c-1");
		expect(instance.lastConnectedAt).toBeNull();
	});

	it("updates lifecycle status with semantic methods", () => {
		const reputation = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation,
		});

		instance.markConnecting();
		expect(instance.connectionStatus).toBe("CONNECTING");

		instance.markConnected();
		expect(instance.connectionStatus).toBe("CONNECTED");
		expect(instance.lifecycleStatus).toBe("ACTIVE");
		expect(instance.lastConnectedAt).toBeInstanceOf(Date);

		instance.markDisconnected();
		expect(instance.connectionStatus).toBe("DISCONNECTED");
	});

	it("prevents state changes after banned", () => {
		const reputation = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation,
		});

		instance.markBanned();
		expect(instance.lifecycleStatus).toBe("BANNED");

		instance.markConnecting();
		expect(instance.lifecycleStatus).toBe("BANNED");

		instance.markConnected();
		expect(instance.lifecycleStatus).toBe("BANNED");

		instance.enterCooldown();
		expect(instance.lifecycleStatus).toBe("BANNED");
	});

	it("manages active campaigns without duplicates", () => {
		const reputation = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation,
		});

		instance.attachCampaign("cmp-1");
		instance.attachCampaign("cmp-1");
		expect(instance.activeCampaignIds).toEqual(["cmp-1"]);

		instance.attachCampaign("cmp-2");
		expect(instance.activeCampaignIds).toEqual(["cmp-1", "cmp-2"]);

		instance.detachCampaign("cmp-1");
		expect(instance.activeCampaignIds).toEqual(["cmp-2"]);
	});

	it("decides canWarmUp/canDispatch semantically", () => {
		const reputation = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation,
			purpose: "MIXED",
		});

		expect(instance.canWarmUp()).toBe(false);
		expect(instance.canDispatch()).toBe(false);

		instance.markConnected();
		expect(instance.canWarmUp()).toBe(true);
		expect(instance.canDispatch()).toBe(true);
	});

	it("blocks dispatch when purpose is WARMUP", () => {
		const reputation = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation,
			purpose: "WARMUP",
		});

		instance.markConnected();
		expect(instance.canDispatch()).toBe(false);
	});
});

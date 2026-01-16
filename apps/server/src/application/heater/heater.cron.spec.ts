import { describe, expect, it, vi } from "vitest";
import { HeaterCron } from "./heater.cron";

describe("HeaterCron", () => {
	it("runs heater for each active instance id", async () => {
		const activeInstanceIds = {
			list: vi.fn(async () => ["i-1", "i-2"]),
		};

		const heater = {
			execute: vi.fn(async () => {}),
		};

		const cron = new HeaterCron(activeInstanceIds as any, heater as any);
		const now = new Date("2026-01-16T00:00:00.000Z");
		await cron.run(now);

		expect(activeInstanceIds.list).toHaveBeenCalledTimes(1);
		expect(heater.execute).toHaveBeenNthCalledWith(1, "i-1", now);
		expect(heater.execute).toHaveBeenNthCalledWith(2, "i-2", now);
	});
});


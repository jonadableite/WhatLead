import { describe, expect, it, vi } from "vitest";
import { DispatchUseCase } from "./dispatch.use-case";
import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";

describe("DispatchUseCase", () => {
	it("blocks when gate blocks", async () => {
		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const instanceRepository = {
			findById: vi.fn(async () => instance),
		};

		const gate = {
			execute: vi.fn(async () => ({ allowed: false, reason: "RATE_LIMIT" })),
		};

		const metricIngestion = { recordMany: vi.fn(async () => {}) };
		const dispatchPort = { send: vi.fn() };

		const useCase = new DispatchUseCase(
			instanceRepository as any,
			gate as any,
			dispatchPort as any,
			metricIngestion as any,
		);

		const out = await useCase.execute({
			instanceId: "i-1",
			intent: { source: "BOT" },
			message: { type: "TEXT", to: "t", text: "oi" },
			now: new Date("2026-01-16T00:00:00.000Z"),
		});

		expect(out.result.status).toBe("BLOCKED");
		expect(dispatchPort.send).not.toHaveBeenCalled();
	});

	it("sends when decision allows and budget ok", async () => {
		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const instanceRepository = {
			findById: vi.fn(async () => instance),
		};

		const gate = {
			execute: vi.fn(async () => ({ allowed: true })),
		};

		const producedEvents = [
			{
				type: "MESSAGE_SENT",
				source: "DISPATCH",
				instanceId: "i-1",
				occurredAt: new Date("2026-01-16T00:00:00.000Z"),
				isGroup: false,
				remoteJid: "t",
				metadata: {},
			},
		];

		const metricIngestion = { recordMany: vi.fn(async () => {}) };
		const dispatchPort = {
			send: vi.fn(async () => ({
				success: true,
				messageId: "m-1",
				occurredAt: new Date("2026-01-16T00:00:00.000Z"),
				producedEvents,
			})),
		};
		const outboundRecorder = { execute: vi.fn(async () => {}) };

		const useCase = new DispatchUseCase(
			instanceRepository as any,
			gate as any,
			dispatchPort as any,
			metricIngestion as any,
			outboundRecorder as any,
		);

		const out = await useCase.execute({
			instanceId: "i-1",
			intent: { source: "BOT" },
			message: { type: "TEXT", to: "t", text: "oi" },
			now: new Date("2026-01-16T00:00:00.000Z"),
		});

		expect(out.result.status).toBe("SENT");
		expect(metricIngestion.recordMany).toHaveBeenCalledWith(producedEvents);
		expect(outboundRecorder.execute).toHaveBeenCalledTimes(1);
	});

	it("blocks when gate returns RATE_LIMIT", async () => {
		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "c-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const instanceRepository = {
			findById: vi.fn(async () => instance),
		};

		const gate = {
			execute: vi.fn(async () => ({ allowed: false, reason: "RATE_LIMIT" })),
		};

		const metricIngestion = { recordMany: vi.fn(async () => {}) };
		const dispatchPort = { send: vi.fn() };

		const useCase = new DispatchUseCase(
			instanceRepository as any,
			gate as any,
			dispatchPort as any,
			metricIngestion as any,
		);

		const out = await useCase.execute({
			instanceId: "i-1",
			intent: { source: "BOT" },
			message: { type: "TEXT", to: "t", text: "oi" },
			now: new Date("2026-01-16T00:05:00.000Z"),
		});

		expect(out.result.status).toBe("BLOCKED");
		expect(out.decision.allowed).toBe(false);
		expect((out.decision as any).reason).toBe("RATE_LIMIT");
	});
});

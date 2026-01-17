import { describe, expect, it, vi } from "vitest";
import { InMemoryReputationSignalRepository } from "../../infra/signals/in-memory-reputation-signal-repository";
import { GetReputationTimelineUseCase } from "../use-cases/get-reputation-timeline.use-case";
import { DispatchUseCase } from "./dispatch.use-case";
import { DispatchPolicy } from "../../domain/services/dispatch-policy";
import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";

describe("DispatchUseCase", () => {
	it("blocks when health does not allow dispatch", async () => {
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

		const evaluateInstanceHealth = {
			execute: vi.fn(async () => ({
				status: { lifecycle: "ACTIVE", connection: "CONNECTED" },
				reputationScore: 50,
				temperatureLevel: "COLD",
				riskLevel: "LOW",
				alerts: [],
				actions: ["BLOCK_DISPATCH"],
				warmUpPhase: "NEWBORN",
				cooldownReason: null,
				signalsSnapshot: {} as any,
			})),
		};

		const repo = new InMemoryReputationSignalRepository();
		const timeline = new GetReputationTimelineUseCase(repo);

		const metricIngestion = { recordMany: vi.fn(async () => {}) };
		const dispatchPort = { send: vi.fn() };

		const useCase = new DispatchUseCase(
			instanceRepository as any,
			evaluateInstanceHealth as any,
			new DispatchPolicy(),
			dispatchPort as any,
			metricIngestion as any,
			timeline,
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

		const evaluateInstanceHealth = {
			execute: vi.fn(async () => ({
				status: { lifecycle: "ACTIVE", connection: "CONNECTED" },
				reputationScore: 50,
				temperatureLevel: "COLD",
				riskLevel: "LOW",
				alerts: [],
				actions: ["ALLOW_DISPATCH"],
				warmUpPhase: "NEWBORN",
				cooldownReason: null,
				signalsSnapshot: {} as any,
			})),
		};

		const repo = new InMemoryReputationSignalRepository();
		const timeline = new GetReputationTimelineUseCase(repo);

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
			evaluateInstanceHealth as any,
			new DispatchPolicy(),
			dispatchPort as any,
			metricIngestion as any,
			timeline,
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

	it("blocks when min interval is not respected", async () => {
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

		const evaluateInstanceHealth = {
			execute: vi.fn(async () => ({
				status: { lifecycle: "ACTIVE", connection: "CONNECTED" },
				reputationScore: 50,
				temperatureLevel: "COLD",
				riskLevel: "LOW",
				alerts: [],
				actions: ["ALLOW_DISPATCH"],
				warmUpPhase: "NEWBORN",
				cooldownReason: null,
				signalsSnapshot: {} as any,
			})),
		};

		const repo = new InMemoryReputationSignalRepository();
		await repo.append({
			type: "MESSAGE_SENT",
			severity: "LOW",
			source: "DISPATCH",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T00:04:30.000Z"),
			context: {},
		});
		const timeline = new GetReputationTimelineUseCase(repo);

		const metricIngestion = { recordMany: vi.fn(async () => {}) };
		const dispatchPort = { send: vi.fn() };

		const useCase = new DispatchUseCase(
			instanceRepository as any,
			evaluateInstanceHealth as any,
			new DispatchPolicy(),
			dispatchPort as any,
			metricIngestion as any,
			timeline,
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

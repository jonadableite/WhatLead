import { describe, expect, it, vi } from "vitest";
import { InMemoryReputationSignalRepository } from "../../infra/signals/in-memory-reputation-signal-repository";
import { GetReputationTimelineUseCase } from "../use-cases/get-reputation-timeline.use-case";
import { WarmupOrchestratorUseCase } from "./warmup-orchestrator.use-case";

describe("WarmupOrchestratorUseCase", () => {
	it("executes controlled warmup when health allows dispatch", async () => {
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

		const targets = {
			listTargets: vi.fn(async () => ["t"]),
		};

		const content = {
			randomText: () => "kkk",
		};

		const producedEvent = {
			type: "MESSAGE_SENT",
			source: "DISPATCH",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T00:00:00.000Z"),
			isGroup: false,
			remoteJid: "t",
			metadata: {},
		};

		const dispatchPort = {
			send: vi.fn(async () => ({ success: true, producedEvents: [producedEvent] })),
		};

		const metricIngestion = {
			recordMany: vi.fn(async () => {}),
		};

		const repo = new InMemoryReputationSignalRepository();
		const timeline = new GetReputationTimelineUseCase(repo);

		const orchestrator = new WarmupOrchestratorUseCase(
			evaluateInstanceHealth as any,
			targets as any,
			content as any,
			dispatchPort as any,
			metricIngestion as any,
			timeline,
		);

		const now = new Date("2026-01-16T00:00:00.000Z");
		const result = await orchestrator.execute("i-1", now);

		expect(result.plan).not.toBeNull();
		expect(result.executedActions).toBe(1);
		expect(dispatchPort.send).toHaveBeenCalledTimes(1);
		expect(metricIngestion.recordMany).toHaveBeenCalledWith([producedEvent]);
	});

	it("does not execute when budget is exhausted", async () => {
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

		const targets = {
			listTargets: vi.fn(async () => ["t"]),
		};

		const content = {
			randomText: () => "kkk",
		};

		const dispatchPort = {
			send: vi.fn(),
		};

		const metricIngestion = {
			recordMany: vi.fn(),
		};

		const repo = new InMemoryReputationSignalRepository();
		await repo.append({
			type: "MESSAGE_SENT",
			severity: "LOW",
			source: "DISPATCH",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T00:30:00.000Z"),
			context: {},
		});
		await repo.append({
			type: "MESSAGE_SENT",
			severity: "LOW",
			source: "DISPATCH",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T00:40:00.000Z"),
			context: {},
		});

		const timeline = new GetReputationTimelineUseCase(repo);
		const orchestrator = new WarmupOrchestratorUseCase(
			evaluateInstanceHealth as any,
			targets as any,
			content as any,
			dispatchPort as any,
			metricIngestion as any,
			timeline,
		);

		const result = await orchestrator.execute(
			"i-1",
			new Date("2026-01-16T01:00:00.000Z"),
		);

		expect(result.plan).not.toBeNull();
		expect(result.executedActions).toBe(0);
		expect(dispatchPort.send).not.toHaveBeenCalled();
	});
});


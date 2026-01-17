import { describe, expect, it, vi } from "vitest";
import { TimelineDispatchRateSnapshotAdapter } from "../../infra/dispatch-gate/timeline-dispatch-rate-snapshot-adapter";
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

		const dispatch = {
			execute: vi.fn(async () => ({
				decision: {
					allowed: true,
					maxMessages: 2,
					minIntervalSeconds: 60,
					allowedMessageTypes: ["TEXT", "REACTION"],
				},
				result: { status: "SENT", occurredAt: new Date("2026-01-16T00:00:00.000Z") },
			})),
		};

		const dispatchPort = {
			send: vi.fn(),
		};

		const metricIngestion = {
			recordMany: vi.fn(async () => {}),
		};

		const repo = new InMemoryReputationSignalRepository();
		const timeline = new GetReputationTimelineUseCase(repo);
		const rateSnapshots = new TimelineDispatchRateSnapshotAdapter(timeline);

		const orchestrator = new WarmupOrchestratorUseCase(
			evaluateInstanceHealth as any,
			targets as any,
			content as any,
			dispatch as any,
			dispatchPort as any,
			metricIngestion as any,
			timeline,
			rateSnapshots,
		);

		const now = new Date("2026-01-16T00:00:00.000Z");
		const result = await orchestrator.execute("i-1", now);

		expect(result.plan).not.toBeNull();
		expect(result.executedActions).toBe(1);
		expect(dispatch.execute).toHaveBeenCalledTimes(1);
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

		const dispatch = {
			execute: vi.fn(),
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
		const rateSnapshots = new TimelineDispatchRateSnapshotAdapter(timeline);
		const orchestrator = new WarmupOrchestratorUseCase(
			evaluateInstanceHealth as any,
			targets as any,
			content as any,
			dispatch as any,
			dispatchPort as any,
			metricIngestion as any,
			timeline,
			rateSnapshots,
		);

		const result = await orchestrator.execute(
			"i-1",
			new Date("2026-01-16T01:00:00.000Z"),
		);

		expect(result.plan).not.toBeNull();
		expect(result.executedActions).toBe(0);
		expect(dispatchPort.send).not.toHaveBeenCalled();
		expect(dispatch.execute).not.toHaveBeenCalled();
	});
});

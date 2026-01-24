import { describe, expect, it, vi } from "vitest";
import { TimelineDispatchRateSnapshotAdapter } from "../../infra/dispatch-gate/timeline-dispatch-rate-snapshot-adapter";
import { InMemoryReputationSignalRepository } from "../../infra/signals/in-memory-reputation-signal-repository";
import { GetReputationTimelineUseCase } from "../use-cases/get-reputation-timeline.use-case";
import { WarmupOrchestratorUseCase } from "./warmup-orchestrator.use-case";
import { InMemoryMessageIntentRepository } from "../../infra/repositories/in-memory-message-intent-repository";

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

		const intents = new InMemoryMessageIntentRepository();
		const gate = {
			execute: vi.fn(async () => ({ decision: "APPROVED", instanceId: "i-1" })),
		};
		const idFactory = { createId: () => "id-1" };

		const dispatchPort = {
			send: vi.fn(),
		};

		const metricIngestion = {
			recordMany: vi.fn(async () => {}),
		};

		const repo = new InMemoryReputationSignalRepository();
		const timeline = new GetReputationTimelineUseCase(repo);
		const rateSnapshots = new TimelineDispatchRateSnapshotAdapter(timeline);

		const instanceRepository = {
			findById: vi.fn(async () => ({
				id: "i-1",
				companyId: "t-1",
			})),
		};

		const orchestrator = new WarmupOrchestratorUseCase(
			instanceRepository as any,
			evaluateInstanceHealth as any,
			targets as any,
			content as any,
			intents as any,
			gate as any,
			idFactory,
			dispatchPort as any,
			metricIngestion as any,
			timeline,
			rateSnapshots,
		);

		const now = new Date("2026-01-16T00:00:00.000Z");
		const result = await orchestrator.execute("i-1", now);

		expect(result.plan).not.toBeNull();
		expect(result.executedActions).toBe(1);
		expect(gate.execute).toHaveBeenCalledTimes(1);
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

		const intents = new InMemoryMessageIntentRepository();
		const gate = { execute: vi.fn() };
		const idFactory = { createId: () => "id-1" };

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

		const instanceRepository = {
			findById: vi.fn(async () => ({
				id: "i-1",
				companyId: "t-1",
			})),
		};

		const orchestrator = new WarmupOrchestratorUseCase(
			instanceRepository as any,
			evaluateInstanceHealth as any,
			targets as any,
			content as any,
			intents as any,
			gate as any,
			idFactory,
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
		expect(gate.execute).not.toHaveBeenCalled();
	});
});

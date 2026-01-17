import { describe, expect, it } from "vitest";
import { InMemoryReputationSignalRepository } from "../../infra/signals/in-memory-reputation-signal-repository";
import { GetReputationTimelineUseCase } from "../use-cases/get-reputation-timeline.use-case";
import { TimelineDispatchRateSnapshotAdapter } from "../../infra/dispatch-gate/timeline-dispatch-rate-snapshot-adapter";
import { WarmupLimiter } from "./warmup-limiter";

describe("WarmupLimiter", () => {
	it("counts only DISPATCH message-like signals in last hour", async () => {
		const repo = new InMemoryReputationSignalRepository();
		const timeline = new GetReputationTimelineUseCase(repo);
		const rateSnapshots = new TimelineDispatchRateSnapshotAdapter(timeline);
		const limiter = new WarmupLimiter(rateSnapshots);

		const now = new Date("2026-01-16T02:00:00.000Z");
		await repo.append({
			type: "MESSAGE_SENT",
			severity: "LOW",
			source: "DISPATCH",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T01:30:00.000Z"),
			context: {},
		});
		await repo.append({
			type: "MESSAGE_SENT",
			severity: "LOW",
			source: "WEBHOOK",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T01:40:00.000Z"),
			context: {},
		});

		const budget = await limiter.getBudget({
			instanceId: "i-1",
			now,
			maxMessagesPerHour: 3,
		});

		expect(budget.usedMessageLikeInLastHour).toBe(1);
		expect(budget.remainingMessageLikeInLastHour).toBe(2);
	});
});

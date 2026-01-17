import { describe, expect, it } from "vitest";
import { InMemoryReputationSignalRepository } from "../../infra/signals/in-memory-reputation-signal-repository";
import { GetReputationTimelineUseCase } from "./get-reputation-timeline.use-case";

describe("GetReputationTimelineUseCase", () => {
	it("returns signals in window", async () => {
		const repo = new InMemoryReputationSignalRepository();
		const useCase = new GetReputationTimelineUseCase(repo);

		await repo.append({
			type: "MESSAGE_SENT",
			severity: "LOW",
			source: "DISPATCH",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T00:00:00.000Z"),
			context: {},
		});

		await repo.append({
			type: "CONNECTION_DISCONNECTED",
			severity: "HIGH",
			source: "WEBHOOK",
			instanceId: "i-1",
			occurredAt: new Date("2026-01-16T02:00:00.000Z"),
			context: {},
		});

		const result = await useCase.execute({
			instanceId: "i-1",
			since: new Date("2026-01-16T01:00:00.000Z"),
			until: new Date("2026-01-16T03:00:00.000Z"),
		});

		expect(result).toHaveLength(1);
		expect(result[0]?.type).toBe("CONNECTION_DISCONNECTED");
	});
});


import { describe, expect, it } from "vitest";
import { InMemoryDispatchGateDecisionRecorder } from "../../infra/dispatch-gate/in-memory-dispatch-gate-decision-recorder";
import { GetDispatchGateMetricsUseCase } from "./get-dispatch-gate-metrics.use-case";

describe("GetDispatchGateMetricsUseCase", () => {
	it("aggregates allowed and blocked decisions", async () => {
		const store = new InMemoryDispatchGateDecisionRecorder();
		const useCase = new GetDispatchGateMetricsUseCase(store);

		const now = new Date("2026-01-16T00:00:00.000Z");
		await store.record({
			intent: { instanceId: "i-1", tenantId: "t-1", type: "REPLY", payload: { type: "TEXT", to: "p-1", text: "a" }, reason: "SYSTEM" },
			decision: { allowed: true },
			occurredAt: now,
		});
		await store.record({
			intent: { instanceId: "i-1", tenantId: "t-1", type: "REPLY", payload: { type: "TEXT", to: "p-1", text: "b" }, reason: "SYSTEM" },
			decision: { allowed: false, reason: "RATE_LIMIT" },
			occurredAt: now,
		});

		const out = await useCase.execute({ since: new Date("2026-01-15T00:00:00.000Z"), until: new Date("2026-01-17T00:00:00.000Z"), tenantId: "t-1" });
		expect(out.allowed).toBe(1);
		expect(out.blocked).toBe(1);
		expect(out.blockReasons["RATE_LIMIT"]).toBe(1);
	});
});


import { describe, expect, it, vi } from "vitest";
import { DispatchMessageIntentGateUseCase } from "./dispatch-message-intent-gate.use-case";
import { MessageIntent } from "../../domain/entities/message-intent";
import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";
import { DispatchPolicy } from "../../domain/services/dispatch-policy";
import { InstanceDispatchScoreService } from "../../domain/services/instance-dispatch-score-service";
import { InMemoryMessageIntentRepository } from "../../infra/repositories/in-memory-message-intent-repository";

describe("DispatchMessageIntentGateUseCase", () => {
	it("approves a pending intent by choosing an eligible instance", async () => {
		const now = new Date("2026-01-24T00:00:00.000Z");

		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "t-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const intent = MessageIntent.create({
			id: "mi-1",
			organizationId: "t-1",
			target: { kind: "PHONE", value: "+5511999999999" },
			type: "TEXT",
			purpose: "WARMUP",
			payload: { type: "TEXT", text: "oi" },
			now,
		});

		const intents = new InMemoryMessageIntentRepository();
		await intents.create(intent);

		const gate = new DispatchMessageIntentGateUseCase(
			intents,
			{ listByCompanyId: vi.fn(async () => [instance]) } as any,
			{ execute: vi.fn(async () => ({ actions: ["ALLOW_DISPATCH"], status: { lifecycle: "ACTIVE" } })) } as any,
			new DispatchPolicy(),
			{
				getSnapshot: vi.fn(async () => ({
					sentLastMinute: 0,
					sentLastHour: 0,
					lastMessageAt: null,
					oldestMessageAtLastHour: null,
					recentTextSignatures: [],
				})),
			} as any,
			{ getLimits: vi.fn(async () => ({})) } as any,
			new InstanceDispatchScoreService(),
			{ publishMany: vi.fn(), publish: vi.fn() } as any,
		);

		const out = await gate.execute({ intentId: "mi-1", organizationId: "t-1", now });

		expect(out.decision).toBe("APPROVED");
		expect((out as any).instanceId).toBe("i-1");

		const saved = await intents.findById("mi-1");
		expect(saved?.status).toBe("APPROVED");
		expect(saved?.decidedByInstanceId).toBe("i-1");
	});

	it("queues an intent when minInterval is not respected", async () => {
		const now = new Date("2026-01-24T00:10:00.000Z");
		const lastMessageAt = new Date("2026-01-24T00:08:00.000Z");

		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "t-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const intent = MessageIntent.create({
			id: "mi-1",
			organizationId: "t-1",
			target: { kind: "PHONE", value: "+5511999999999" },
			type: "TEXT",
			purpose: "WARMUP",
			payload: { type: "TEXT", text: "oi" },
			now,
		});

		const intents = new InMemoryMessageIntentRepository();
		await intents.create(intent);

		const gate = new DispatchMessageIntentGateUseCase(
			intents,
			{ listByCompanyId: vi.fn(async () => [instance]) } as any,
			{ execute: vi.fn(async () => ({ actions: ["ALLOW_DISPATCH"], status: { lifecycle: "ACTIVE" } })) } as any,
			new DispatchPolicy(),
			{
				getSnapshot: vi.fn(async () => ({
					sentLastMinute: 0,
					sentLastHour: 0,
					lastMessageAt,
					oldestMessageAtLastHour: null,
					recentTextSignatures: [],
				})),
			} as any,
			{ getLimits: vi.fn(async () => ({})) } as any,
			new InstanceDispatchScoreService(),
			{ publishMany: vi.fn(), publish: vi.fn() } as any,
		);

		const out = await gate.execute({ intentId: "mi-1", organizationId: "t-1", now });

		expect(out.decision).toBe("QUEUED");
		expect((out as any).queuedUntil).toBeInstanceOf(Date);
	});

	it("blocks when there is no eligible instance", async () => {
		const now = new Date("2026-01-24T00:00:00.000Z");

		const intent = MessageIntent.create({
			id: "mi-1",
			organizationId: "t-1",
			target: { kind: "PHONE", value: "+5511999999999" },
			type: "TEXT",
			purpose: "WARMUP",
			payload: { type: "TEXT", text: "oi" },
			now,
		});

		const intents = new InMemoryMessageIntentRepository();
		await intents.create(intent);

		const gate = new DispatchMessageIntentGateUseCase(
			intents,
			{ listByCompanyId: vi.fn(async () => []) } as any,
			{ execute: vi.fn(async () => ({ actions: ["ALLOW_DISPATCH"], status: { lifecycle: "ACTIVE" } })) } as any,
			new DispatchPolicy(),
			{ getSnapshot: vi.fn() } as any,
			{ getLimits: vi.fn(async () => ({})) } as any,
			new InstanceDispatchScoreService(),
			{ publishMany: vi.fn(), publish: vi.fn() } as any,
		);

		const out = await gate.execute({ intentId: "mi-1", organizationId: "t-1", now });
		expect(out.decision).toBe("BLOCKED");
	});
});


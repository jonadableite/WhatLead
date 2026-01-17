import { describe, expect, it, vi } from "vitest";
import { DispatchGateUseCase } from "./dispatch-gate.use-case";
import { DispatchPolicy } from "../../domain/services/dispatch-policy";
import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";
import { Conversation } from "../../domain/entities/conversation";
import { SLAEvaluator } from "../../domain/services/sla-evaluator";

describe("DispatchGateUseCase", () => {
	it("blocks FOLLOW_UP when SLA is not breached", async () => {
		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "t-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const conversation = Conversation.open({
			id: "c-1",
			tenantId: "t-1",
			channel: "WHATSAPP",
			instanceId: "i-1",
			contactId: "p-1",
			openedAt: new Date("2026-01-16T00:00:00.000Z"),
		});
		conversation.receiveInboundMessage({
			messageId: "m-1",
			type: "TEXT",
			occurredAt: new Date("2026-01-16T00:00:00.000Z"),
		});

		const gate = new DispatchGateUseCase(
			{ findById: vi.fn(async () => instance) } as any,
			{ execute: vi.fn(async () => ({ actions: ["ALLOW_DISPATCH"] })) } as any,
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
			{ findById: vi.fn(async () => conversation) } as any,
			new SLAEvaluator(),
		);

		const out = await gate.execute({
			instanceId: "i-1",
			conversationId: "c-1",
			type: "FOLLOW_UP",
			payload: { type: "TEXT", to: "p-1", text: "oi" },
			reason: "SLA",
			now: new Date("2026-01-16T00:05:00.000Z"),
		});

		expect(out.allowed).toBe(false);
		expect((out as any).reason).toBe("POLICY_BLOCKED");
	});

	it("returns delayedUntil when minInterval is not respected", async () => {
		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "t-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const now = new Date("2026-01-16T00:05:00.000Z");
		const lastMessageAt = new Date("2026-01-16T00:03:30.000Z");

		const gate = new DispatchGateUseCase(
			{ findById: vi.fn(async () => instance) } as any,
			{ execute: vi.fn(async () => ({ actions: ["ALLOW_DISPATCH"] })) } as any,
			new DispatchPolicy(),
			{
				getSnapshot: vi.fn(async () => ({
					sentLastMinute: 0,
					sentLastHour: 0,
					lastMessageAt,
					oldestMessageAtLastHour: lastMessageAt,
					recentTextSignatures: [],
				})),
			} as any,
			{ findById: vi.fn(async () => null) } as any,
			new SLAEvaluator(),
		);

		const out = await gate.execute({
			instanceId: "i-1",
			type: "REPLY",
			payload: { type: "TEXT", to: "p-1", text: "oi" },
			reason: "SYSTEM",
			now,
		});

		expect(out.allowed).toBe(false);
		expect((out as any).reason).toBe("RATE_LIMIT");
		expect((out as any).delayedUntil).toBeInstanceOf(Date);
	});
});

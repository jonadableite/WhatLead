import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { DispatchPolicy } from "../../domain/services/dispatch-policy";
import type { SLAEvaluator } from "../../domain/services/sla-evaluator";
import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import type { DispatchIntentSource } from "../../domain/value-objects/dispatch-intent-source";
import { messageTypeOf } from "../dispatch/dispatch-types";
import type { DispatchIntent } from "./dispatch-intent";
import type { DispatchGateDecision } from "./dispatch-gate-decision";
import type { DispatchRateSnapshotPort } from "./dispatch-rate-snapshot-port";

export class DispatchGateUseCase {
	private static readonly MAX_MESSAGES_PER_MINUTE = 2;
	private static readonly DUPLICATE_TEXT_WINDOW_MS = 2 * 60 * 1000;

	constructor(
		private readonly instances: InstanceRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
		private readonly dispatchPolicy: DispatchPolicy,
		private readonly rateSnapshots: DispatchRateSnapshotPort,
		private readonly conversations: ConversationRepository,
		private readonly slaEvaluator: SLAEvaluator,
	) {}

	async execute(intent: DispatchIntent): Promise<DispatchGateDecision> {
		const now = intent.now ?? new Date();

		const instance = await this.instances.findById(intent.instanceId);
		if (!instance) {
			return { allowed: false, reason: "INSTANCE_NOT_ACTIVE" };
		}

		const health = await this.evaluateInstanceHealth.execute({
			instanceId: intent.instanceId,
			reason: "PRE_DISPATCH",
			now,
		});
		if (
			health.actions.includes("ENTER_COOLDOWN") ||
			!health.actions.includes("ALLOW_DISPATCH")
		) {
			return { allowed: false, reason: "COOLDOWN" };
		}

		if (intent.type === "FOLLOW_UP") {
			if (!intent.conversationId) {
				return { allowed: false, reason: "POLICY_BLOCKED" };
			}
			const conversation = await this.conversations.findById({ id: intent.conversationId });
			if (!conversation) {
				return { allowed: false, reason: "POLICY_BLOCKED" };
			}
			const slaStatus = this.slaEvaluator.evaluate(conversation, now);
			if (slaStatus !== "BREACHED") {
				return { allowed: false, reason: "POLICY_BLOCKED" };
			}
		}

		const policyDecision = this.dispatchPolicy.evaluate({
			instance,
			reputation: instance.reputation,
			intentSource: intentSourceFor(intent),
			messageType: messageTypeOf(intent.payload),
			now,
		});
		if (!policyDecision.allowed) {
			return { allowed: false, reason: policyDecision.reason };
		}

		const snapshot = await this.rateSnapshots.getSnapshot({
			instanceId: intent.instanceId,
			now,
		});

		if (intent.payload.type === "TEXT") {
			const signature = `${intent.payload.to}:${intent.payload.text}`;
			if (snapshot.recentTextSignatures.includes(signature)) {
				return {
					allowed: false,
					reason: "RATE_LIMIT",
					delayedUntil: new Date(now.getTime() + DispatchGateUseCase.DUPLICATE_TEXT_WINDOW_MS),
				};
			}
		}

		if (snapshot.lastMessageAt) {
			const minIntervalMs = policyDecision.minIntervalSeconds * 1000;
			if (minIntervalMs > 0) {
				const nextAllowedAt = new Date(snapshot.lastMessageAt.getTime() + minIntervalMs);
				if (now.getTime() < nextAllowedAt.getTime()) {
					return { allowed: false, reason: "RATE_LIMIT", delayedUntil: nextAllowedAt };
				}
			}
		}

		if (snapshot.sentLastHour >= policyDecision.maxMessages) {
			const delayedUntil = snapshot.oldestMessageAtLastHour
				? new Date(snapshot.oldestMessageAtLastHour.getTime() + 60 * 60 * 1000)
				: undefined;
			return { allowed: false, reason: "RATE_LIMIT", delayedUntil };
		}

		if (snapshot.sentLastMinute >= DispatchGateUseCase.MAX_MESSAGES_PER_MINUTE) {
			return { allowed: false, reason: "RATE_LIMIT", delayedUntil: new Date(now.getTime() + 60 * 1000) };
		}

		return { allowed: true };
	}
}

const intentSourceFor = (intent: DispatchIntent): DispatchIntentSource => {
	if (intent.type === "WARMUP") {
		return "WARMUP";
	}
	if (intent.reason === "OPERATOR") {
		return "HUMAN";
	}
	if (intent.reason === "AGENT") {
		return "AGENT";
	}
	return "BOT";
};

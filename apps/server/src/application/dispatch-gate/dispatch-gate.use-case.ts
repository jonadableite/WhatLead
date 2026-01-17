import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { DispatchPolicy } from "../../domain/services/dispatch-policy";
import type { SLAEvaluator } from "../../domain/services/sla-evaluator";
import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import type { DispatchIntentSource } from "../../domain/value-objects/dispatch-intent-source";
import type { PlanPolicy } from "../billing/plan-policy";
import { messageTypeOf } from "../dispatch/dispatch-types";
import type { DispatchGateDecision } from "./dispatch-gate-decision";
import type { DispatchGateDecisionRecorderPort } from "./dispatch-gate-decision-recorder-port";
import type { DispatchIntent } from "./dispatch-intent";
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
		private readonly decisionRecorder?: DispatchGateDecisionRecorderPort,
		private readonly planPolicy?: PlanPolicy,
	) {}

	async execute(intent: DispatchIntent): Promise<DispatchGateDecision> {
		const now = intent.now ?? new Date();
		const decide = async (decision: DispatchGateDecision): Promise<DispatchGateDecision> => {
			if (this.decisionRecorder) {
				await this.decisionRecorder.record({
					intent,
					decision,
					occurredAt: now,
				});
			}
			return decision;
		};

		const instance = await this.instances.findById(intent.instanceId);
		if (!instance) {
			return await decide({ allowed: false, reason: "INSTANCE_NOT_ACTIVE" });
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
			return await decide({ allowed: false, reason: "COOLDOWN" });
		}

		if (intent.type === "FOLLOW_UP") {
			if (!intent.conversationId) {
				return await decide({ allowed: false, reason: "POLICY_BLOCKED" });
			}
			const conversation = await this.conversations.findById({ id: intent.conversationId });
			if (!conversation) {
				return await decide({ allowed: false, reason: "POLICY_BLOCKED" });
			}
			const slaStatus = this.slaEvaluator.evaluate(conversation, now);
			if (slaStatus !== "BREACHED") {
				return await decide({ allowed: false, reason: "POLICY_BLOCKED" });
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
			return await decide({ allowed: false, reason: policyDecision.reason });
		}

		const snapshot = await this.rateSnapshots.getSnapshot({
			instanceId: intent.instanceId,
			now,
		});

		const planLimits =
			intent.tenantId && this.planPolicy
				? await this.planPolicy.getLimits({ tenantId: intent.tenantId, intent, now })
				: {};

		if (intent.payload.type === "TEXT") {
			const signature = `${intent.payload.to}:${intent.payload.text}`;
			if (snapshot.recentTextSignatures.includes(signature)) {
				return await decide({
					allowed: false,
					reason: "RATE_LIMIT",
					delayedUntil: new Date(now.getTime() + DispatchGateUseCase.DUPLICATE_TEXT_WINDOW_MS),
				});
			}
		}

		if (snapshot.lastMessageAt) {
			const minIntervalMs = policyDecision.minIntervalSeconds * 1000;
			if (minIntervalMs > 0) {
				const nextAllowedAt = new Date(snapshot.lastMessageAt.getTime() + minIntervalMs);
				if (now.getTime() < nextAllowedAt.getTime()) {
					return await decide({ allowed: false, reason: "RATE_LIMIT", delayedUntil: nextAllowedAt });
				}
			}
		}

		if (snapshot.sentLastHour >= policyDecision.maxMessages) {
			const delayedUntil = snapshot.oldestMessageAtLastHour
				? new Date(snapshot.oldestMessageAtLastHour.getTime() + 60 * 60 * 1000)
				: undefined;
			return await decide({ allowed: false, reason: "RATE_LIMIT", delayedUntil });
		}

		const maxPerMinute = planLimits.maxMessagesPerMinute ?? DispatchGateUseCase.MAX_MESSAGES_PER_MINUTE;
		if (snapshot.sentLastMinute >= maxPerMinute) {
			return await decide({ allowed: false, reason: "RATE_LIMIT", delayedUntil: new Date(now.getTime() + 60 * 1000) });
		}

		const maxPerHour = planLimits.maxMessagesPerHour;
		if (typeof maxPerHour === "number" && snapshot.sentLastHour >= maxPerHour) {
			const delayedUntil = snapshot.oldestMessageAtLastHour
				? new Date(snapshot.oldestMessageAtLastHour.getTime() + 60 * 60 * 1000)
				: undefined;
			return await decide({ allowed: false, reason: "RATE_LIMIT", delayedUntil });
		}

		return await decide({ allowed: true });
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

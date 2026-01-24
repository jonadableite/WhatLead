import type { Instance } from "../../domain/entities/instance";
import type { MessageIntent } from "../../domain/entities/message-intent";
import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { MessageIntentDomainEvent } from "../../domain/events/message-intent-events";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import { DispatchPolicy } from "../../domain/services/dispatch-policy";
import { InstanceDispatchScoreService } from "../../domain/services/instance-dispatch-score-service";
import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import type { DispatchIntentSource } from "../../domain/value-objects/dispatch-intent-source";
import type { MessageGateDecisionReason } from "../../domain/value-objects/message-gate-decision-reason";
import type { MessageType } from "../../domain/value-objects/message-type";
import type { PlanPolicy } from "../billing/plan-policy";
import type { DispatchIntent } from "../dispatch-gate/dispatch-intent";
import type { DispatchRateSnapshotPort } from "../dispatch-gate/dispatch-rate-snapshot-port";
import type { DispatchPayload } from "../dispatch/dispatch-types";
import type { ExecutionControlPolicy } from "../ops/execution-control-policy";

export interface DispatchMessageIntentGateUseCaseRequest {
	intentId: string;
	organizationId: string;
	now?: Date;
}

export type DispatchMessageIntentGateUseCaseResponse =
	| { decision: "APPROVED"; instanceId: string }
	| { decision: "QUEUED"; queuedUntil: Date; reason: MessageGateDecisionReason }
	| { decision: "BLOCKED"; reason: MessageGateDecisionReason };

type CandidateDecision =
	| { kind: "ALLOW"; instanceId: string; score: number }
	| { kind: "QUEUE"; queuedUntil: Date; reason: MessageGateDecisionReason }
	| { kind: "BLOCK"; reason: MessageGateDecisionReason };

export class DispatchMessageIntentGateUseCase {
	constructor(
		private readonly intents: MessageIntentRepository,
		private readonly instances: InstanceRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
		private readonly dispatchPolicy: DispatchPolicy,
		private readonly rateSnapshots: DispatchRateSnapshotPort,
		private readonly planPolicy: PlanPolicy | null,
		private readonly executionControl: ExecutionControlPolicy | null,
		private readonly scorer: InstanceDispatchScoreService,
		private readonly eventBus: DomainEventBus<MessageIntentDomainEvent>,
	) {}

	async execute(
		request: DispatchMessageIntentGateUseCaseRequest,
	): Promise<DispatchMessageIntentGateUseCaseResponse> {
		const now = request.now ?? new Date();

		const intent = await this.intents.findById(request.intentId);
		if (!intent || intent.organizationId !== request.organizationId) {
			throw new Error("MESSAGE_INTENT_NOT_FOUND");
		}

		if (!intent.isPending(now)) {
			if (intent.status === "APPROVED" && intent.decidedByInstanceId) {
				return { decision: "APPROVED", instanceId: intent.decidedByInstanceId };
			}
			if (intent.status === "QUEUED" && intent.queuedUntil && intent.blockedReason) {
				return { decision: "QUEUED", queuedUntil: intent.queuedUntil, reason: intent.blockedReason };
			}
			return { decision: "BLOCKED", reason: intent.blockedReason ?? "POLICY_BLOCKED" };
		}

		if (this.executionControl) {
			const org = await this.executionControl.isOrganizationPaused({
				organizationId: request.organizationId,
				now,
			});
			if (!org.allowed) {
				const events = intent.block({ reason: "OPS_PAUSED", now });
				await this.intents.save(intent);
				await this.eventBus.publishMany(events);
				return { decision: "BLOCKED", reason: "OPS_PAUSED" };
			}
		}

		const orgInstances = await this.instances.listByCompanyId(request.organizationId);
		if (!orgInstances.length) {
			const events = intent.block({ reason: "NO_ELIGIBLE_INSTANCE", now });
			await this.intents.save(intent);
			await this.eventBus.publishMany(events);
			return { decision: "BLOCKED", reason: "NO_ELIGIBLE_INSTANCE" };
		}

		const candidates = await Promise.all(
			orgInstances.map(async (instance) => this.evaluateCandidate({ intent, instance, now })),
		);

		const bestAllow = candidates
			.filter((c): c is Extract<CandidateDecision, { kind: "ALLOW" }> => c.kind === "ALLOW")
			.sort((a, b) => b.score - a.score)[0];

		if (bestAllow) {
			const health = await this.evaluateInstanceHealth.execute({
				instanceId: bestAllow.instanceId,
				reason: "PRE_DISPATCH",
				now,
			});

			if (!health.actions.includes("ALLOW_DISPATCH")) {
				const queuedUntil = this.cooldownUntilFrom(health, now);
				if (queuedUntil) {
					const events = intent.queue({
						queuedUntil,
						reason: "COOLDOWN_ACTIVE",
						now,
					});
					await this.intents.save(intent);
					await this.eventBus.publishMany(events);
					return { decision: "QUEUED", queuedUntil, reason: "COOLDOWN_ACTIVE" };
				}

				const events = intent.block({ reason: "INSTANCE_UNHEALTHY", now });
				await this.intents.save(intent);
				await this.eventBus.publishMany(events);
				return { decision: "BLOCKED", reason: "INSTANCE_UNHEALTHY" };
			}

			const events = intent.approve({ instanceId: bestAllow.instanceId, now });
			await this.intents.save(intent);
			await this.eventBus.publishMany(events);
			return { decision: "APPROVED", instanceId: bestAllow.instanceId };
		}

		const queueCandidates = candidates.filter(
			(c): c is Extract<CandidateDecision, { kind: "QUEUE" }> => c.kind === "QUEUE",
		);
		if (queueCandidates.length) {
			const chosen = queueCandidates.sort(
				(a, b) => a.queuedUntil.getTime() - b.queuedUntil.getTime(),
			)[0]!;

			const events = intent.queue({
				queuedUntil: chosen.queuedUntil,
				reason: chosen.reason,
				now,
			});
			await this.intents.save(intent);
			await this.eventBus.publishMany(events);
			return { decision: "QUEUED", queuedUntil: chosen.queuedUntil, reason: chosen.reason };
		}

		const blockReason =
			candidates.find((c): c is Extract<CandidateDecision, { kind: "BLOCK" }> => c.kind === "BLOCK")
				?.reason ?? "NO_ELIGIBLE_INSTANCE";

		const events = intent.block({ reason: blockReason, now });
		await this.intents.save(intent);
		await this.eventBus.publishMany(events);
		return { decision: "BLOCKED", reason: blockReason };
	}

	private async evaluateCandidate(params: {
		intent: MessageIntent;
		instance: Instance;
		now: Date;
	}): Promise<CandidateDecision> {
		const { intent, instance, now } = params;

		if (this.executionControl) {
			const inst = await this.executionControl.isInstancePaused({ instanceId: instance.id, now });
			if (!inst.allowed) return { kind: "BLOCK", reason: "OPS_PAUSED" };
		}

		if (intent.purpose === "WARMUP") {
			if (!instance.canWarmUp()) return { kind: "BLOCK", reason: "INSTANCE_UNHEALTHY" };
		} else {
			if (instance.purpose === "WARMUP") {
				return { kind: "BLOCK", reason: "NO_ELIGIBLE_INSTANCE" };
			}
			if (!instance.canDispatch(now)) {
				return {
					kind: "QUEUE",
					queuedUntil: cooldownUntilFromInstance(instance, now),
					reason: "COOLDOWN_ACTIVE",
				};
			}
		}

		const messageType = toDomainMessageType(intent.type);
		const intentSource = toDispatchIntentSource(intent.purpose);

		const policyDecision = this.dispatchPolicy.evaluate({
			instance,
			reputation: instance.reputation,
			intentSource,
			messageType,
			now,
		});

		if (!policyDecision.allowed) {
			return { kind: "BLOCK", reason: mapBlockReason(policyDecision.reason) };
		}

		const snapshot = await this.rateSnapshots.getSnapshot({ instanceId: instance.id, now });

		if (messageType === "TEXT") {
			const text = (intent.payload as any).text as string | undefined;
			if (text) {
				const signature = `${intent.target.value}:${text.toLowerCase()}`;
				if (snapshot.recentTextSignatures.includes(signature)) {
					return { kind: "BLOCK", reason: "RATE_LIMIT" };
				}
			}
		}

		if (snapshot.lastMessageAt) {
			const minMs = policyDecision.minIntervalSeconds * 1000;
			if (minMs > 0 && now.getTime() - snapshot.lastMessageAt.getTime() < minMs) {
				return {
					kind: "QUEUE",
					queuedUntil: new Date(snapshot.lastMessageAt.getTime() + minMs),
					reason: "RATE_LIMIT",
				};
			}
		}

		if (snapshot.sentLastHour >= policyDecision.maxMessages) {
			const until = snapshot.oldestMessageAtLastHour
				? new Date(snapshot.oldestMessageAtLastHour.getTime() + 60 * 60 * 1000)
				: new Date(now.getTime() + 60 * 60 * 1000);
			return { kind: "QUEUE", queuedUntil: until, reason: "RATE_LIMIT" };
		}

		if (this.planPolicy) {
			const plan = await this.planPolicy.getLimits({
				tenantId: intent.organizationId,
				intent: toPlanIntent({ intent, instanceId: instance.id }),
				now,
			});

			if (plan.maxMessagesPerMinute && snapshot.sentLastMinute >= plan.maxMessagesPerMinute) {
				return {
					kind: "QUEUE",
					queuedUntil: new Date(now.getTime() + 60 * 1000),
					reason: "PLAN_LIMIT",
				};
			}

			if (plan.maxMessagesPerHour && snapshot.sentLastHour >= plan.maxMessagesPerHour) {
				const until = snapshot.oldestMessageAtLastHour
					? new Date(snapshot.oldestMessageAtLastHour.getTime() + 60 * 60 * 1000)
					: new Date(now.getTime() + 60 * 60 * 1000);
				return { kind: "QUEUE", queuedUntil: until, reason: "PLAN_LIMIT" };
			}
		}

		return {
			kind: "ALLOW",
			instanceId: instance.id,
			score: this.scorer.score({ instance, intentPurpose: intent.purpose }),
		};
	}

	private cooldownUntilFrom(
		health: Awaited<ReturnType<EvaluateInstanceHealthUseCase["execute"]>>,
		now: Date,
	): Date | null {
		if (health.status.lifecycle !== "COOLDOWN") return null;
		return new Date(now.getTime() + 60 * 60 * 1000);
	}
}

const toDomainMessageType = (intentType: string): MessageType => {
	if (intentType === "MEDIA") return "IMAGE";
	if (intentType === "AUDIO") return "AUDIO";
	if (intentType === "REACTION") return "REACTION";
	return "TEXT";
};

const toDispatchIntentSource = (purpose: string): DispatchIntentSource => {
	if (purpose === "WARMUP") return "WARMUP";
	if (purpose === "SCHEDULE") return "CAMPAIGN";
	return "HUMAN";
};

const mapBlockReason = (reason: string): MessageGateDecisionReason => {
	if (reason === "UNSUPPORTED_MESSAGE_TYPE") return "UNSUPPORTED_MESSAGE_TYPE";
	if (reason === "RATE_LIMIT") return "RATE_LIMIT";
	if (reason === "COOLDOWN" || reason === "OVERHEATED") return "COOLDOWN_ACTIVE";
	if (reason === "POLICY_BLOCKED") return "POLICY_BLOCKED";
	return "INSTANCE_UNHEALTHY";
};

const cooldownUntilFromInstance = (instance: Instance, now: Date): Date => {
	const startedAt = instance.reputation.cooldownStartedAt;
	if (!startedAt) return new Date(now.getTime() + 60 * 60 * 1000);
	return new Date(startedAt.getTime() + 60 * 60 * 1000);
};

const toPlanIntent = (params: {
	intent: MessageIntent;
	instanceId: string;
}): DispatchIntent => {
	const { intent, instanceId } = params;
	return {
		instanceId,
		tenantId: intent.organizationId,
		type: intent.purpose === "WARMUP" ? "WARMUP" : intent.purpose === "SCHEDULE" ? "CAMPAIGN" : "REPLY",
		reason: intent.purpose === "WARMUP" ? "SYSTEM" : "OPERATOR",
		payload: messageIntentToDispatchPayload(intent),
	};
};

const messageIntentToDispatchPayload = (intent: MessageIntent): DispatchPayload => {
	switch (intent.payload.type) {
		case "TEXT":
			return { type: "TEXT", to: intent.target.value, text: intent.payload.text };
		case "REACTION":
			return {
				type: "REACTION",
				to: intent.target.value,
				messageId: intent.payload.messageRef ?? "unknown",
				emoji: intent.payload.emoji,
			};
		case "AUDIO":
			return { type: "AUDIO", to: intent.target.value, mediaUrl: intent.payload.audioUrl, ptt: true };
		case "MEDIA":
			return {
				type: "IMAGE",
				to: intent.target.value,
				mediaUrl: intent.payload.mediaUrl,
				mimeType: intent.payload.mimeType,
				caption: intent.payload.caption,
			};
	}
};

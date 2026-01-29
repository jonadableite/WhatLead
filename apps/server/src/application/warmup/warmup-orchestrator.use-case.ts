import { MessageIntent } from "../../domain/entities/message-intent";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import type { MessageIntentPayload } from "../../domain/value-objects/message-intent-payload";
import type { MessageTarget } from "../../domain/value-objects/message-target";
import type { DispatchRateSnapshotPort } from "../dispatch-gate/dispatch-rate-snapshot-port";
import type { WarmUpContentProvider } from "../heater/content/warmup-content-provider";
import type { DispatchAction, DispatchPort } from "../heater/dispatch-port";
import type { WarmUpTargetsProvider } from "../heater/targets/warmup-targets-provider";
import type { DispatchMessageIntentGateUseCase } from "../message-dispatch/dispatch-message-intent-gate.use-case";
import type { MetricIngestionPort } from "../ports/metric-ingestion-port";
import type { GetReputationTimelineUseCase } from "../use-cases/get-reputation-timeline.use-case";
import { WarmupLimiter } from "./warmup-limiter";
import type { WarmupPlan } from "./warmup-plan";
import { WarmupPlanFactory } from "./warmup-plan-factory";

export class WarmupOrchestratorUseCase {
	private readonly limiter: WarmupLimiter;

	constructor(
		private readonly instanceRepository: InstanceRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
		private readonly targets: WarmUpTargetsProvider,
		private readonly content: WarmUpContentProvider,
		private readonly intents: MessageIntentRepository,
		private readonly gate: DispatchMessageIntentGateUseCase,
		private readonly idFactory: { createId: () => string },
		private readonly dispatchPort: DispatchPort,
		private readonly metricIngestion: MetricIngestionPort,
		private readonly timeline: GetReputationTimelineUseCase,
		private readonly rateSnapshots: DispatchRateSnapshotPort,
	) {
		this.limiter = new WarmupLimiter(this.rateSnapshots);
	}

	async execute(
		instanceId: string,
		now: Date = new Date(),
	): Promise<
		| {
				plan: WarmupPlan;
				executedActions: number;
				stoppedBecause: "BUDGET" | "NO_TARGETS" | "DISPATCH_FAILED" | "BLOCKED";
		  }
		| { plan: null; executedActions: 0; stoppedBecause: "HEALTH" | "NO_INSTANCE" }
	> {
		let health: Awaited<ReturnType<EvaluateInstanceHealthUseCase["execute"]>>;
		try {
			health = await this.evaluateInstanceHealth.execute({
				instanceId,
				reason: "CRON",
				now,
			});
		} catch {
			return { plan: null, executedActions: 0, stoppedBecause: "NO_INSTANCE" };
		}

		const plan = WarmupPlanFactory.fromHealth({ instanceId, health });
		if (!plan) {
			return { plan: null, executedActions: 0, stoppedBecause: "HEALTH" };
		}

		const instance = await this.instanceRepository.findById(instanceId);
		if (!instance) {
			return { plan: null, executedActions: 0, stoppedBecause: "NO_INSTANCE" };
		}

		const targets = await this.targets.listTargets(instanceId);
		if (targets.length === 0) {
			return {
				plan,
				executedActions: 0,
				stoppedBecause: "NO_TARGETS",
			};
		}

		const budget = await this.limiter.getBudget({
			instanceId,
			now,
			maxMessagesPerHour: plan.maxMessagesPerHour,
		});
		if (budget.remainingMessageLikeInLastHour <= 0) {
			return { plan, executedActions: 0, stoppedBecause: "BUDGET" };
		}

		const seed = stableHash(`${instanceId}:${plan.phase}:${now.toISOString()}`);
		const rng = mulberry32(seed);

		const to = targets[0]!;
		let executed = 0;
		const maxActions = Math.min(plan.maxActionsPerRun, budget.remainingMessageLikeInLastHour);

		for (let i = 0; i < maxActions; i += 1) {
			const action = await this.buildAction({
				instanceId,
				to,
				now,
				plan,
				rng,
			});
			if (!action) {
				break;
			}

			try {
				if (action.type === "SEND_TEXT") {
					const intentId = await this.createWarmupIntent({
						organizationId: instance.companyId,
						target: { kind: "PHONE", value: action.to },
						payload: { type: "TEXT", text: action.text },
						now,
					});

					const decision = await this.gate.execute({
						intentId,
						organizationId: instance.companyId,
						now,
					});

					if (decision.decision !== "APPROVED") {
						return { plan, executedActions: executed, stoppedBecause: "BLOCKED" };
					}
					executed += 1;
					continue;
				}

				if (action.type === "SEND_REACTION") {
					const intentId = await this.createWarmupIntent({
						organizationId: instance.companyId,
						target: { kind: "PHONE", value: action.to },
						payload: {
							type: "REACTION",
							emoji: action.emoji,
							messageRef: action.messageId,
						},
						now,
					});

					const decision = await this.gate.execute({
						intentId,
						organizationId: instance.companyId,
						now,
					});

					if (decision.decision !== "APPROVED") {
						return { plan, executedActions: executed, stoppedBecause: "BLOCKED" };
					}
					executed += 1;
					continue;
				}

				const result = await this.dispatchPort.send(action);
				if (!result.success) {
					return {
						plan,
						executedActions: executed,
						stoppedBecause: "DISPATCH_FAILED",
					};
				}
				if (result.producedEvents && result.producedEvents.length > 0) {
					await this.metricIngestion.recordMany(result.producedEvents);
				}
				executed += 1;
			} catch {
				return { plan, executedActions: executed, stoppedBecause: "BLOCKED" };
			}
		}

		return { plan, executedActions: executed, stoppedBecause: "BUDGET" };
	}

	private async createWarmupIntent(params: {
		organizationId: string;
		target: MessageTarget;
		payload: MessageIntentPayload;
		now: Date;
	}): Promise<string> {
		const intent = MessageIntent.create({
			id: this.idFactory.createId(),
			organizationId: params.organizationId,
			target: params.target,
			type: params.payload.type,
			purpose: "WARMUP",
			origin: "WARMUP",
			payload: params.payload,
			now: params.now,
		});
		await this.intents.create(intent);
		return intent.id;
	}

	private async buildAction(params: {
		instanceId: string;
		to: string;
		now: Date;
		plan: WarmupPlan;
		rng: () => number;
	}): Promise<DispatchAction | null> {
		const kind = pickKind(params.plan, params.rng);

		switch (kind) {
			case "SET_PRESENCE":
				return {
					type: "SET_PRESENCE",
					instanceId: params.instanceId,
					to: params.to,
					presence: "composing",
					delayMs: delayFor(params.plan.phase, params.rng),
				};
			case "SEND_TEXT":
				return {
					type: "SEND_TEXT",
					instanceId: params.instanceId,
					to: params.to,
					text: this.content.randomText(),
					delayMs: delayFor(params.plan.phase, params.rng),
				};
			case "MARK_AS_READ": {
				const ctx = await this.findRecentMessageContext(params.instanceId, params.now);
				if (!ctx?.messageId) {
					return null;
				}
				return {
					type: "MARK_AS_READ",
					instanceId: params.instanceId,
					messageId: ctx.messageId,
					delayMs: delayFor(params.plan.phase, params.rng),
				};
			}
			case "SEND_REACTION": {
				const ctx = await this.findRecentMessageContext(params.instanceId, params.now);
				if (!ctx?.messageId || !ctx.remoteJid) {
					return null;
				}
				return {
					type: "SEND_REACTION",
					instanceId: params.instanceId,
					to: ctx.remoteJid,
					messageId: ctx.messageId,
					emoji: pickEmoji(params.rng),
					delayMs: delayFor(params.plan.phase, params.rng),
				};
			}
		}
	}

	private async findRecentMessageContext(
		instanceId: string,
		now: Date,
	): Promise<{ messageId?: string; remoteJid?: string } | null> {
		const since = new Date(now.getTime() - 60 * 60 * 1000);
		const signals = await this.timeline.execute({ instanceId, since, until: now });
		const last = [...signals]
			.reverse()
			.find((s) => typeof s.messageId === "string" && typeof s.remoteJid === "string");
		if (!last) {
			return null;
		}
		return { messageId: last.messageId, remoteJid: last.remoteJid };
	}
}

const pickKind = (
	plan: WarmupPlan,
	rng: () => number,
): WarmupPlan["allowedActions"][number] => {
	const allowed: readonly WarmupPlan["allowedActions"][number][] =
		plan.allowedActions.length > 0 ? plan.allowedActions : (["SEND_TEXT"] as const);
	const roll = rng() * 100;

	const weights = {
		SEND_TEXT: plan.contentMix.text,
		SEND_REACTION: plan.contentMix.reaction,
		SET_PRESENCE: Math.max(0, 100 - plan.contentMix.text - plan.contentMix.reaction),
		MARK_AS_READ: 0,
	} as const;

	let acc = 0;
	for (const kind of ["SET_PRESENCE", "SEND_TEXT", "SEND_REACTION", "MARK_AS_READ"] as const) {
		if (!allowed.includes(kind)) {
			continue;
		}
		acc += weights[kind];
		if (roll <= acc) {
			return kind;
		}
	}
	return allowed[0]!;
};

const delayFor = (phase: WarmupPlan["phase"], rng: () => number): number => {
	const base = phase === "BOOT" ? 15_000 : phase === "SOFT" ? 10_000 : 6_000;
	const jitter = Math.floor(rng() * 3_000);
	return base + jitter;
};

const pickEmoji = (rng: () => number): string => {
	const emojis = ["👍", "😂", "🙏", "❤️"] as const;
	return emojis[Math.floor(rng() * emojis.length)]!;
};

const stableHash = (input: string): number => {
	let h = 2166136261;
	for (let i = 0; i < input.length; i += 1) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
};

const mulberry32 = (seed: number): (() => number) => {
	let a = seed >>> 0;
	return () => {
		a += 0x6d2b79f5;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

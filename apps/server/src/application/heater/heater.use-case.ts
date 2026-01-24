import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import { MessageIntent } from "../../domain/entities/message-intent";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { DispatchMessageIntentGateUseCase } from "../message-dispatch/dispatch-message-intent-gate.use-case";
import type { MetricIngestionPort } from "../ports/metric-ingestion-port";
import type { DispatchPort } from "./dispatch-port";
import type { WarmUpStrategy } from "./warmup-strategy";

export class HeaterUseCase {
	constructor(
		private readonly instanceRepository: InstanceRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
		private readonly warmUpStrategy: WarmUpStrategy,
		private readonly dispatchPort: DispatchPort,
		private readonly intents: MessageIntentRepository,
		private readonly gate: DispatchMessageIntentGateUseCase,
		private readonly idFactory: { createId: () => string },
		private readonly metricIngestion: MetricIngestionPort,
	) {}

	async execute(instanceId: string, now: Date = new Date()): Promise<void> {
		const health = await this.evaluateInstanceHealth.execute({
			instanceId,
			reason: "CRON",
			now,
		});

		if (!health.actions.includes("ALLOW_DISPATCH")) {
			return;
		}

		const instance = await this.instanceRepository.findById(instanceId);
		if (!instance) {
			return;
		}

		const phase = instance.reputation.currentWarmUpPhase(now);
		const plan = await this.warmUpStrategy.plan({ instance, phase, now });

		for (const action of plan.actions) {
			if (action.type === "SEND_TEXT") {
				const intent = MessageIntent.create({
					id: this.idFactory.createId(),
					organizationId: instance.companyId,
					target: { kind: "PHONE", value: action.to },
					type: "TEXT",
					purpose: "WARMUP",
					payload: { type: "TEXT", text: action.text },
					now,
				});
				await this.intents.create(intent);
				await this.gate.execute({ intentId: intent.id, organizationId: instance.companyId, now });
				continue;
			}

			if (action.type === "SEND_REACTION") {
				const intent = MessageIntent.create({
					id: this.idFactory.createId(),
					organizationId: instance.companyId,
					target: { kind: "PHONE", value: action.to },
					type: "REACTION",
					purpose: "WARMUP",
					payload: { type: "REACTION", emoji: action.emoji, messageRef: action.messageId },
					now,
				});
				await this.intents.create(intent);
				await this.gate.execute({ intentId: intent.id, organizationId: instance.companyId, now });
				continue;
			}

			let result: Awaited<ReturnType<DispatchPort["send"]>>;
			try {
				result = await this.dispatchPort.send(action);
			} catch {
				return;
			}

			if (result.producedEvents && result.producedEvents.length > 0) {
				await this.metricIngestion.recordMany(result.producedEvents);
			}

			if (!result.success) {
				return;
			}
		}
	}
}

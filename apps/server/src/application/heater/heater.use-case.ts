import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import type { MetricIngestionPort } from "../ports/metric-ingestion-port";
import type { DispatchPort } from "./dispatch-port";
import type { WarmUpStrategy } from "./warmup-strategy";

export class HeaterUseCase {
	constructor(
		private readonly instanceRepository: InstanceRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
		private readonly warmUpStrategy: WarmUpStrategy,
		private readonly dispatchPort: DispatchPort,
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
			const result = await this.dispatchPort.send(action);

			if (result.producedEvents && result.producedEvents.length > 0) {
				await this.metricIngestion.recordMany(result.producedEvents);
			}

			const midHealth = await this.evaluateInstanceHealth.execute({
				instanceId,
				reason: "PRE_DISPATCH",
				now,
			});

			if (midHealth.actions.includes("BLOCK_DISPATCH")) {
				return;
			}

			if (!result.success) {
				return;
			}
		}
	}
}

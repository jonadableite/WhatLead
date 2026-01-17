import type { DomainEventBus } from "../events/domain-event-bus";
import type { InstanceDomainEvent } from "../events/instance-events";
import { InstanceReputation } from "../entities/instance-reputation";
import type { InstanceRepository } from "../repositories/instance-repository";
import type { InstanceMetricRepository } from "../repositories/instance-metric-repository";
import type { InstanceReputationRepository } from "../repositories/instance-reputation-repository";
import type { IInstanceReputationEvaluator } from "../services/instance-reputation-evaluator";
import type { InstanceHealthAction } from "../value-objects/instance-health-action";
import type { InstanceHealthEvaluationReason } from "../value-objects/instance-health-evaluation-reason";
import type { InstanceTemperatureLevel } from "../value-objects/instance-temperature-level";
import type { ReputationAlert } from "../value-objects/reputation-alert";
import type { InstanceConnectionStatus } from "../value-objects/instance-connection-status";
import type { InstanceLifecycleStatus } from "../value-objects/instance-lifecycle-status";
import type { CooldownReason } from "../value-objects/cooldown-reason";
import type { WarmUpPhase } from "../value-objects/warmup-phase";
import type { ReputationSignals } from "../entities/instance-reputation";

export interface EvaluateInstanceHealthUseCaseRequest {
	instanceId: string;
	reason: InstanceHealthEvaluationReason;
	now?: Date;
}

export interface EvaluateInstanceHealthUseCaseResponse {
	status: {
		lifecycle: InstanceLifecycleStatus;
		connection: InstanceConnectionStatus;
	};
	reputationScore: number;
	temperatureLevel: InstanceTemperatureLevel;
	riskLevel: "LOW" | "MEDIUM" | "HIGH";
	alerts: readonly ReputationAlert[];
	actions: readonly InstanceHealthAction[];
	warmUpPhase: WarmUpPhase;
	cooldownReason: CooldownReason | null;
	signalsSnapshot: Readonly<ReputationSignals>;
}

export class EvaluateInstanceHealthUseCase {
	constructor(
		private readonly instanceRepository: InstanceRepository,
		private readonly reputationRepository: InstanceReputationRepository,
		private readonly metricRepository: InstanceMetricRepository,
		private readonly evaluator: IInstanceReputationEvaluator,
		private readonly eventBus: DomainEventBus<InstanceDomainEvent>,
	) {}

	async execute(
		request: EvaluateInstanceHealthUseCaseRequest,
	): Promise<EvaluateInstanceHealthUseCaseResponse> {
		const now = request.now ?? new Date();

		const instance = await this.instanceRepository.findById(request.instanceId);
		if (!instance) {
			throw new Error("Instance not found");
		}

		let reputation =
			await this.reputationRepository.findByInstanceId(request.instanceId);
		if (!reputation) {
			reputation = InstanceReputation.initialize(request.instanceId);
		}

		const signals = await this.metricRepository.getRecentSignals(request.instanceId);
		const evaluated = this.evaluator.evaluate(reputation, signals);

		instance.updateReputation(evaluated);
		const { actions, events } = instance.evaluateHealth({
			reason: request.reason,
			now,
		});

		await this.reputationRepository.save(evaluated);
		await this.instanceRepository.save(instance);
		await this.eventBus.publishMany(events);

		return {
			status: {
				lifecycle: instance.lifecycleStatus,
				connection: instance.connectionStatus,
			},
			reputationScore: evaluated.score,
			temperatureLevel: evaluated.temperatureLevel,
			riskLevel: evaluated.getRiskLevel().toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
			alerts: evaluated.alerts,
			actions,
			warmUpPhase: evaluated.currentWarmUpPhase(now),
			cooldownReason: evaluated.cooldownReason,
			signalsSnapshot: signals,
		};
	}
}

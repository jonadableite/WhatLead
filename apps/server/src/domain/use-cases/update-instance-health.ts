import type { InstanceDomainEvent } from "../events/instance-events";
import { InstanceReputation } from "../entities/instance-reputation";
import type { InstanceRepository } from "../repositories/instance-repository";
import type { InstanceMetricRepository } from "../repositories/instance-metric-repository";
import type { InstanceReputationRepository } from "../repositories/instance-reputation-repository";
import type { IInstanceReputationEvaluator } from "../services/instance-reputation-evaluator";
import type { InstanceTemperatureLevel } from "../value-objects/instance-temperature-level";
import type { ReputationAlert } from "../value-objects/reputation-alert";

interface UpdateInstanceHealthRequest {
	companyId: string;
	instanceId: string;
	now?: Date;
}

interface UpdateInstanceHealthResponse {
	instanceId: string;
	companyId: string;
	lifecycleStatus: import("../value-objects/instance-lifecycle-status").InstanceLifecycleStatus;
	connectionStatus: import("../value-objects/instance-connection-status").InstanceConnectionStatus;
	reputationScore: number;
	temperatureLevel: InstanceTemperatureLevel;
	riskLevel: "low" | "medium" | "high";
	alerts: readonly ReputationAlert[];
	events: readonly InstanceDomainEvent[];
}

export class UpdateInstanceHealthUseCase {
	constructor(
		private readonly instanceRepository: InstanceRepository,
		private readonly reputationRepository: InstanceReputationRepository,
		private readonly metricRepository: InstanceMetricRepository,
		private readonly evaluator: IInstanceReputationEvaluator,
	) {}

	async execute(
		request: UpdateInstanceHealthRequest,
	): Promise<UpdateInstanceHealthResponse> {
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

		const events: InstanceDomainEvent[] = [];

		if (instance.requiresCooldown() && instance.lifecycleStatus !== "COOLDOWN") {
			instance.enterCooldown();
			events.push({
				type: "InstanceEnteredCooldown",
				occurredAt: now,
				instanceId: instance.id,
				companyId: instance.companyId,
			});
		}

		if (
			instance.lifecycleStatus === "COOLDOWN" &&
			!instance.requiresCooldown() &&
			!instance.isAtRisk()
		) {
			instance.exitCooldown();
			events.push({
				type: "InstanceRecovered",
				occurredAt: now,
				instanceId: instance.id,
				companyId: instance.companyId,
			});
		}

		if (instance.isAtRisk()) {
			events.push({
				type: "InstanceAtRisk",
				occurredAt: now,
				instanceId: instance.id,
				companyId: instance.companyId,
			});
		}

		await this.reputationRepository.save(evaluated);
		await this.instanceRepository.save(instance);

		return {
			instanceId: instance.id,
			companyId: instance.companyId,
			lifecycleStatus: instance.lifecycleStatus,
			connectionStatus: instance.connectionStatus,
			reputationScore: evaluated.score,
			temperatureLevel: evaluated.temperatureLevel,
			riskLevel: evaluated.getRiskLevel(),
			alerts: evaluated.alerts,
			events,
		};
	}
}


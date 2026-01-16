import type { DomainEventBus } from "../events/domain-event-bus";
import type { InstanceDomainEvent } from "../events/instance-events";
import type { InstanceRepository } from "../repositories/instance-repository";
import type { InstanceMetricRepository } from "../repositories/instance-metric-repository";
import type { InstanceReputationRepository } from "../repositories/instance-reputation-repository";
import type { IInstanceReputationEvaluator } from "../services/instance-reputation-evaluator";
import type { InstanceTemperatureLevel } from "../value-objects/instance-temperature-level";
import type { ReputationAlert } from "../value-objects/reputation-alert";
import { EvaluateInstanceHealthUseCase } from "./evaluate-instance-health";

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

		const events: InstanceDomainEvent[] = [];
		const eventBus: DomainEventBus<InstanceDomainEvent> = {
			publish: (event) => {
				events.push(event);
			},
			publishMany: (toPublish) => {
				events.push(...toPublish);
			},
		};

		const evaluate = new EvaluateInstanceHealthUseCase(
			this.instanceRepository,
			this.reputationRepository,
			this.metricRepository,
			this.evaluator,
			eventBus,
		);

		const result = await evaluate.execute({
			instanceId: request.instanceId,
			reason: "CRON",
			now,
		});

		return {
			instanceId: request.instanceId,
			companyId: instance.companyId,
			lifecycleStatus: result.status.lifecycle,
			connectionStatus: result.status.connection,
			reputationScore: result.reputationScore,
			temperatureLevel: result.temperatureLevel,
			riskLevel: result.riskLevel.toLowerCase() as "low" | "medium" | "high",
			alerts: result.alerts,
			events,
		};
	}
}

import {
	InstanceReputation,
	type ReputationSignals,
} from "../entities/instance-reputation";
import type { InstanceMetricRepository } from "../repositories/instance-metric-repository";
import type { InstanceReputationRepository } from "../repositories/instance-reputation-repository";
import type { IInstanceReputationEvaluator } from "../services/instance-reputation-evaluator";
import type { InstanceTemperatureLevel } from "../value-objects/instance-temperature-level";
import type { ReputationAlert } from "../value-objects/reputation-alert";

/**
 * Request DTO for reputation evaluation.
 */
interface EvaluateInstanceReputationRequest {
	companyId: string;
	instanceId: string;
}

/**
 * Response DTO with evaluation results.
 */
interface EvaluateInstanceReputationResponse {
	reputationScore: number;
	temperatureLevel: InstanceTemperatureLevel;
	riskLevel: "low" | "medium" | "high";
	alerts: readonly ReputationAlert[];
	signals: Readonly<ReputationSignals>;
	canDispatch: boolean;
	isHealthy: boolean;
}

/**
 * Use Case: Evaluate Instance Reputation
 *
 * Orchestrates the reputation evaluation flow:
 * 1. Load or initialize reputation state
 * 2. Fetch recent behavioral signals
 * 3. Delegate evaluation to domain service
 * 4. Persist updated state
 * 5. Return actionable response
 *
 * This use case is THIN - no business logic lives here.
 * All evaluation rules are in the Evaluator service.
 */
export class EvaluateInstanceReputationUseCase {
	constructor(
		private readonly reputationRepository: InstanceReputationRepository,
		private readonly metricRepository: InstanceMetricRepository,
		private readonly evaluator: IInstanceReputationEvaluator,
	) {}

	async execute(
		request: EvaluateInstanceReputationRequest,
	): Promise<EvaluateInstanceReputationResponse> {
		const { instanceId } = request;

		// 1. Load existing reputation or initialize new one
		let reputation =
			await this.reputationRepository.findByInstanceId(instanceId);

		if (!reputation) {
			// Initialize new instance with default state
			reputation = InstanceReputation.initialize(instanceId);
		}

		// 2. Fetch recent behavioral signals
		const signals = await this.metricRepository.getRecentSignals(instanceId);

		// 3. Evaluate reputation (domain service handles all logic)
		const evaluatedReputation = this.evaluator.evaluate(reputation, signals);

		// 4. Persist updated state
		await this.reputationRepository.save(evaluatedReputation);

		// 5. Return response with all relevant data
		return {
			reputationScore: evaluatedReputation.score,
			temperatureLevel: evaluatedReputation.temperatureLevel,
			riskLevel: evaluatedReputation.getRiskLevel(),
			alerts: evaluatedReputation.alerts,
			signals: evaluatedReputation.signals,
			canDispatch: evaluatedReputation.canDispatch(),
			isHealthy: evaluatedReputation.isHealthy(),
		};
	}
}

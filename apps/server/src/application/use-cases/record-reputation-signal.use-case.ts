import type { ReputationSignal } from "../../domain/value-objects/reputation-signal";
import type { ReputationSignalRepository } from "../../domain/repositories/reputation-signal-repository";
import type {
	EvaluateInstanceHealthUseCase,
	EvaluateInstanceHealthUseCaseResponse,
} from "../../domain/use-cases/evaluate-instance-health";
import type { InstanceHealthEvaluationReason } from "../../domain/value-objects/instance-health-evaluation-reason";

export class RecordReputationSignalUseCase {
	constructor(
		private readonly signalRepository: ReputationSignalRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
	) {}

	async execute(params: {
		signal: ReputationSignal;
		reason?: InstanceHealthEvaluationReason;
	}): Promise<EvaluateInstanceHealthUseCaseResponse> {
		await this.signalRepository.append(params.signal);
		return await this.evaluateInstanceHealth.execute({
			instanceId: params.signal.instanceId,
			reason: params.reason ?? "WEBHOOK",
			now: params.signal.occurredAt,
		});
	}
}


import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ReputationSignalRepository } from "../../domain/repositories/reputation-signal-repository";
import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import type { EvaluateInstanceHealthUseCaseResponse } from "../../domain/use-cases/evaluate-instance-health";
import { toReputationSignal } from "../signals/whatsapp-event-to-reputation-signal";

export class IngestReputationSignalUseCase {
	constructor(
		private readonly signalRepository: ReputationSignalRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
	) {}

	async execute(
		event: NormalizedWhatsAppEvent,
	): Promise<EvaluateInstanceHealthUseCaseResponse | null> {
		const signal = toReputationSignal(event);
		if (!signal) {
			return null;
		}

		await this.signalRepository.append(signal);
		return await this.evaluateInstanceHealth.execute({
			instanceId: signal.instanceId,
			reason: "WEBHOOK",
			now: signal.occurredAt,
		});
	}

	async executeMany(
		events: readonly NormalizedWhatsAppEvent[],
	): Promise<readonly EvaluateInstanceHealthUseCaseResponse[]> {
		const results: EvaluateInstanceHealthUseCaseResponse[] = [];
		for (const event of events) {
			const result = await this.execute(event);
			if (result) {
				results.push(result);
			}
		}
		return results;
	}
}

import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { EvaluateInstanceHealthUseCaseResponse } from "../../domain/use-cases/evaluate-instance-health";
import { toReputationSignal } from "../signals/whatsapp-event-to-reputation-signal";
import type { RecordReputationSignalUseCase } from "./record-reputation-signal.use-case";

export class IngestReputationSignalUseCase {
	constructor(
		private readonly recordSignal: RecordReputationSignalUseCase,
	) {}

	async execute(
		event: NormalizedWhatsAppEvent,
	): Promise<EvaluateInstanceHealthUseCaseResponse | null> {
		const signal = toReputationSignal(event);
		if (!signal) {
			return null;
		}

		return await this.recordSignal.execute({ signal, reason: "WEBHOOK" });
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

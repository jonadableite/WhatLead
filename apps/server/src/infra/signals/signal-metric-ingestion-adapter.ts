import type { MetricIngestionPort } from "../../application/ports/metric-ingestion-port";
import type { NormalizedWhatsAppEvent } from "../../application/event-handlers/webhook-event-handler";
import type { IngestReputationSignalUseCase } from "../../application/use-cases/ingest-reputation-signal.use-case";

export class SignalMetricIngestionAdapter implements MetricIngestionPort {
	constructor(private readonly ingest: IngestReputationSignalUseCase) {}

	async record(event: NormalizedWhatsAppEvent): Promise<void> {
		await this.ingest.execute(event);
	}

	async recordMany(events: readonly NormalizedWhatsAppEvent[]): Promise<void> {
		await this.ingest.executeMany(events);
	}
}


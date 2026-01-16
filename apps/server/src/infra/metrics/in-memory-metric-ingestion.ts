import type { MetricIngestionPort } from "../../application/ports/metric-ingestion-port";
import type { NormalizedWhatsAppEvent } from "../../application/event-handlers/webhook-event-handler";
import { InMemoryMetricStore } from "./in-memory-metric-store";

export class InMemoryMetricIngestion implements MetricIngestionPort {
	constructor(private readonly store: InMemoryMetricStore) {}

	async record(event: NormalizedWhatsAppEvent): Promise<void> {
		this.store.append(event);
	}

	async recordMany(events: readonly NormalizedWhatsAppEvent[]): Promise<void> {
		this.store.appendMany(events);
	}
}


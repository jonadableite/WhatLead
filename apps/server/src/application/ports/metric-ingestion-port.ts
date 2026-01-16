import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";

export interface MetricIngestionPort {
	record(event: NormalizedWhatsAppEvent): Promise<void>;
	recordMany(events: readonly NormalizedWhatsAppEvent[]): Promise<void>;
}


import type { NormalizedWhatsAppEvent } from "../../application/event-handlers/webhook-event-handler";

export class InMemoryMetricStore {
	private readonly eventsByInstanceId = new Map<string, NormalizedWhatsAppEvent[]>();

	append(event: NormalizedWhatsAppEvent): void {
		const list = this.eventsByInstanceId.get(event.instanceId) ?? [];
		list.push(event);
		this.eventsByInstanceId.set(event.instanceId, list);
	}

	appendMany(events: readonly NormalizedWhatsAppEvent[]): void {
		for (const event of events) {
			this.append(event);
		}
	}

	getEvents(instanceId: string): readonly NormalizedWhatsAppEvent[] {
		return this.eventsByInstanceId.get(instanceId) ?? [];
	}
}


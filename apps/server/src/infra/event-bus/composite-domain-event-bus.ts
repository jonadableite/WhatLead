import type { DomainEventBus } from "../../domain/events/domain-event-bus";

export class CompositeDomainEventBus<Event> implements DomainEventBus<Event> {
	constructor(private readonly buses: readonly DomainEventBus<Event>[]) {}

	publish(event: Event): void | Promise<void> {
		for (const bus of this.buses) {
			bus.publish(event);
		}
	}

	publishMany(events: readonly Event[]): void | Promise<void> {
		for (const bus of this.buses) {
			bus.publishMany(events);
		}
	}
}


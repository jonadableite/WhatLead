export interface DomainEventBus<Event> {
	publish(event: Event): Promise<void> | void;
	publishMany(events: readonly Event[]): Promise<void> | void;
}


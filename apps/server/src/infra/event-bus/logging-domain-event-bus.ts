import { createChildLogger } from "@WhatLead/logger";
import type { DomainEventBus } from "../../domain/events/domain-event-bus";

export class LoggingDomainEventBus<Event extends { type: string }>
	implements DomainEventBus<Event>
{
	private readonly logger = createChildLogger({ component: "domain_event_bus" });

	publish(event: Event): void {
		this.logger.info({ event }, "Domain event published");
	}

	publishMany(events: readonly Event[]): void {
		for (const event of events) {
			this.publish(event);
		}
	}
}


import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { MessageIntentDomainEvent } from "../../domain/events/message-intent-events";
import type { OperationalEventRepository } from "../../domain/repositories/operational-event-repository";

export class PersistingMessageIntentEventBus
	implements DomainEventBus<MessageIntentDomainEvent>
{
	constructor(
		private readonly repo: OperationalEventRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async publish(event: MessageIntentDomainEvent): Promise<void> {
		await this.publishMany([event]);
	}

	async publishMany(events: readonly MessageIntentDomainEvent[]): Promise<void> {
		await this.repo.appendMany(
			events.map((e) => ({
				id: this.idFactory.createId(),
				organizationId: e.organizationId,
				aggregateType: "MESSAGE_INTENT",
				aggregateId: e.intentId,
				eventType: e.type,
				payload: e as any,
				occurredAt: e.occurredAt,
				createdAt: new Date(),
			})),
		);
	}
}


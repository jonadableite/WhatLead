import prisma from "@WhatLead/db";

import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { MessageExecutionDomainEvent } from "../../domain/events/message-execution-events";
import type { OperationalEventRepository } from "../../domain/repositories/operational-event-repository";

export class PersistingMessageExecutionEventBus
	implements DomainEventBus<MessageExecutionDomainEvent>
{
	constructor(
		private readonly repo: OperationalEventRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async publish(event: MessageExecutionDomainEvent): Promise<void> {
		await this.publishMany([event]);
	}

	async publishMany(events: readonly MessageExecutionDomainEvent[]): Promise<void> {
		const intentIds = [...new Set(events.map((e) => e.intentId))];
		const intents = await prisma.messageIntent.findMany({
			where: { id: { in: intentIds } },
			select: { id: true, organizationId: true },
		});
		const orgByIntent = new Map(intents.map((i) => [i.id, i.organizationId]));

		await this.repo.appendMany(
			events.map((e) => ({
				id: this.idFactory.createId(),
				organizationId: orgByIntent.get(e.intentId) ?? null,
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


import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { ChatMessageDomainEvent } from "../../domain/events/chat-message-events";
import type { RealtimeGatewayEvent } from "../realtime/websocket-gateway";
import { WebSocketGateway } from "../realtime/websocket-gateway";

export class RealtimeDomainEventPublisher
	implements DomainEventBus<ChatMessageDomainEvent>
{
	constructor(private readonly gateway: WebSocketGateway) {}

	publish(event: ChatMessageDomainEvent): void {
		this.gateway.broadcast(this.toGatewayEvent(event));
	}

	publishMany(events: readonly ChatMessageDomainEvent[]): void {
		for (const event of events) {
			this.publish(event);
		}
	}

	private toGatewayEvent(event: ChatMessageDomainEvent): RealtimeGatewayEvent {
		return {
			organizationId: event.organizationId,
			instanceId: event.instanceId,
			type: event.type,
			payload: {
				conversationId: event.conversationId,
				instanceId: event.instanceId,
				message: {
					id: event.message.id,
					direction: event.message.direction,
					type: event.message.type,
					sentBy: event.message.sentBy,
					status: event.message.status,
					body: event.message.body ?? null,
					occurredAt: event.occurredAt.toISOString(),
				},
			},
		};
	}
}

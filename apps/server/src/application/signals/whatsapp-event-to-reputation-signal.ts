import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ReputationSignal } from "../../domain/value-objects/reputation-signal";

export const toReputationSignal = (
	event: NormalizedWhatsAppEvent,
): ReputationSignal | null => {
	switch (event.type) {
		case "MESSAGE_SENT":
		case "MESSAGE_DELIVERED":
		case "MESSAGE_READ":
		case "MESSAGE_FAILED":
		case "CONNECTION_CONNECTED":
		case "CONNECTION_DISCONNECTED":
		case "CONNECTION_ERROR":
			return {
				type: event.type,
				instanceId: event.instanceId,
				occurredAt: event.occurredAt,
				messageId: event.messageId,
				remoteJid: event.remoteJid,
				isGroup: event.isGroup,
				latencyMs: event.latencyMs,
			};

		case "MESSAGE_RECEIVED":
		case "GROUP_MESSAGE_RECEIVED":
			return {
				type: "MESSAGE_REPLIED",
				instanceId: event.instanceId,
				occurredAt: event.occurredAt,
				messageId: event.messageId,
				remoteJid: event.remoteJid,
				isGroup: event.isGroup,
				latencyMs: event.latencyMs,
			};

		default:
			return null;
	}
};


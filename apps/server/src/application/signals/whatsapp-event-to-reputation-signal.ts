import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ReputationSignal } from "../../domain/value-objects/reputation-signal";

export const toReputationSignal = (
	event: NormalizedWhatsAppEvent,
): ReputationSignal | null => {
	const base = {
		instanceId: event.instanceId,
		occurredAt: event.occurredAt,
		messageId: event.messageId,
		remoteJid: event.remoteJid,
		isGroup: event.isGroup,
		latencyMs: event.latencyMs,
		context: event.metadata ?? {},
	} as const;

	const severity = severityFor(event.type);

	switch (event.type) {
		case "MESSAGE_SENT":
		case "MESSAGE_DELIVERED":
		case "MESSAGE_READ":
		case "MESSAGE_FAILED":
		case "CONNECTION_CONNECTED":
		case "CONNECTION_DISCONNECTED":
		case "CONNECTION_ERROR":
		case "REACTION_SENT":
		case "PRESENCE_SET":
		case "RATE_LIMIT_HIT":
			return {
				type: event.type,
				severity,
				source: event.source,
				...base,
			};

		case "CONNECTION_QRCODE":
			return {
				type: "QRCODE_REGENERATED",
				severity,
				source: event.source,
				...base,
			};

		case "MESSAGE_RECEIVED":
		case "GROUP_MESSAGE_RECEIVED":
			return {
				type: "MESSAGE_REPLIED",
				severity,
				source: event.source,
				...base,
			};

		default:
			return null;
	}
};

const severityFor = (
	type: NormalizedWhatsAppEvent["type"],
): ReputationSignal["severity"] => {
	switch (type) {
		case "MESSAGE_FAILED":
		case "RATE_LIMIT_HIT":
		case "CONNECTION_ERROR":
		case "CONNECTION_DISCONNECTED":
			return "HIGH";
		default:
			return "LOW";
	}
};

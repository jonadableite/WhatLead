/**
 * TurboZap Webhook Handler
 *
 * Transforms TurboZap webhook payloads into normalized WhatsApp events.
 * These normalized events feed into the reputation system.
 *
 * TURBOZAP WEBHOOK EVENTS:
 * - message.received - New message received
 * - message.sent - Message sent via API
 * - messages.update - Message status update (delivered, read)
 * - connection.update - Connection status changed
 * - qrcode.updated - New QR code generated
 */

import type {
	NormalizedWhatsAppEvent,
	WebhookEventTransformer,
	WhatsAppEventType,
} from "../../../application/event-handlers/webhook-event-handler";

// ═══════════════════════════════════════════════════════════════════════════
// TURBOZAP WEBHOOK PAYLOAD TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base TurboZap webhook payload structure.
 */
interface TurboZapWebhookPayload {
	event: string;
	instance_id?: string;
	instance?: string;
	timestamp?: string;
	data?: unknown;
	data_type?: string;
	data_value?: unknown;
	instance_name?: string;
}

/**
 * Message received event data.
 */
interface TurboZapMessageReceivedData {
	message_id: string;
	from: string;
	to: string;
	type: "text" | "image" | "video" | "audio" | "document" | "sticker";
	content: unknown;
	timestamp: string;
	is_group: boolean;
	push_name?: string;
	fromMe?: boolean;
	from_name?: string;
}

/**
 * Message sent event data.
 */
interface TurboZapMessageSentData {
	message_id: string;
	to: string;
	type: string;
	status: string;
	timestamp: string;
}

/**
 * Message update event data (delivery status).
 */
interface TurboZapMessageUpdateData {
	message_id: string;
	status: "sent" | "delivered" | "read" | "failed";
	timestamp: string;
}

/**
 * Connection update event data.
 */
interface TurboZapConnectionUpdateData {
	status: "connected" | "disconnected" | "connecting" | "qrcode" | "error";
	phone_number?: string;
	profile_name?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFORMER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps TurboZap event names to normalized event types.
 */
const EVENT_TYPE_MAP: Record<string, WhatsAppEventType | undefined> = {
	"message.received": "MESSAGE_RECEIVED",
	"message.sent": "MESSAGE_SENT",
	"send-message": "MESSAGE_SENT",
	"messages.upsert": "MESSAGE_RECEIVED",
	"messages.update": undefined, // Handled specially based on status
	"messages.delete": undefined, // Not tracked for reputation
	"connection.update": undefined, // Handled specially based on status
	"qrcode.updated": "CONNECTION_QRCODE",
	"contacts.upsert": undefined, // Not tracked for reputation
	"presence.update": undefined, // Not tracked for reputation
	"groups.upsert": "GROUP_JOINED",
};

/**
 * Maps message update status to event type.
 */
const MESSAGE_STATUS_MAP: Record<string, WhatsAppEventType | undefined> = {
	sent: "MESSAGE_SENT",
	delivered: "MESSAGE_DELIVERED",
	read: "MESSAGE_READ",
	failed: "MESSAGE_FAILED",
};

/**
 * Maps connection status to event type.
 */
const CONNECTION_STATUS_MAP: Record<string, WhatsAppEventType | undefined> = {
	connected: "CONNECTION_CONNECTED",
	disconnected: "CONNECTION_DISCONNECTED",
	connecting: undefined, // Transient, not tracked
	qrcode: "CONNECTION_QRCODE",
	error: "CONNECTION_ERROR",
};

/**
 * Transforms TurboZap webhook payloads into normalized events.
 */
export class TurboZapWebhookTransformer
	implements WebhookEventTransformer<TurboZapWebhookPayload>
{
	readonly providerName = "TurboZap";

	/**
	 * Transforms a raw TurboZap webhook payload into normalized events.
	 */
	transform(raw: TurboZapWebhookPayload): NormalizedWhatsAppEvent[] {
		const events: NormalizedWhatsAppEvent[] = [];
		const data = (raw.data_value ?? raw.data) as unknown;

		// Route to specific handler based on event type
		switch (raw.event) {
			case "message.received":
			case "messages.upsert":
				events.push(
					...this.transformMessageReceived(
						raw,
						data as TurboZapMessageReceivedData,
					),
				);
				break;

			case "message.sent":
			case "send-message":
				events.push(
					...this.transformMessageSent(
						raw,
						data as TurboZapMessageSentData,
					),
				);
				break;

			case "messages.update":
				events.push(
					...this.transformMessageUpdate(
						raw,
						data as TurboZapMessageUpdateData,
					),
				);
				break;

			case "connection.update":
				events.push(
					...this.transformConnectionUpdate(
						raw,
						data as TurboZapConnectionUpdateData,
					),
				);
				break;

			default: {
				// Check if we have a direct mapping
				const eventType = EVENT_TYPE_MAP[raw.event];
				if (eventType) {
					events.push(this.createBaseEvent(raw, eventType));
				}
				// Unknown events are silently ignored
			}
		}

		return events;
	}

	// ─────────────────────────────────────────────────────────────────────────
	// EVENT TRANSFORMERS
	// ─────────────────────────────────────────────────────────────────────────

	private transformMessageReceived(
		raw: TurboZapWebhookPayload,
		data: TurboZapMessageReceivedData,
	): NormalizedWhatsAppEvent[] {
		const eventType: WhatsAppEventType = data.is_group
			? "GROUP_MESSAGE_RECEIVED"
			: "MESSAGE_RECEIVED";

		return [
			{
				type: eventType,
				source: "WEBHOOK",
				instanceId: raw.instance_id || raw.instance || raw.instance_name || "",
				occurredAt: new Date(data.timestamp || raw.timestamp || new Date().toISOString()),
				messageId: data.message_id,
				remoteJid: data.from,
				isGroup: data.is_group,
				metadata: {
					messageType: data.type,
					pushName: data.push_name ?? data.from_name,
					text:
						data.type === "text" && typeof data.content === "string"
							? data.content
							: undefined,
				},
			},
		];
	}

	private transformMessageSent(
		raw: TurboZapWebhookPayload,
		data: TurboZapMessageSentData,
	): NormalizedWhatsAppEvent[] {
		return [
			{
				type: "MESSAGE_SENT",
				source: "WEBHOOK",
				instanceId: raw.instance_id || raw.instance,
				occurredAt: new Date(data.timestamp || raw.timestamp),
				messageId: data.message_id,
				remoteJid: data.to,
				isGroup: false, // Sent messages don't indicate group in this payload
				metadata: {
					messageType: data.type,
					status: data.status,
				},
			},
		];
	}

	private transformMessageUpdate(
		raw: TurboZapWebhookPayload,
		data: TurboZapMessageUpdateData,
	): NormalizedWhatsAppEvent[] {
		const eventType = MESSAGE_STATUS_MAP[data.status];
		if (!eventType) {
			return [];
		}

		return [
			{
				type: eventType,
				source: "WEBHOOK",
				instanceId: raw.instance_id || raw.instance,
				occurredAt: new Date(data.timestamp || raw.timestamp),
				messageId: data.message_id,
				isGroup: false,
				metadata: {
					status: data.status,
				},
			},
		];
	}

	private transformConnectionUpdate(
		raw: TurboZapWebhookPayload,
		data: TurboZapConnectionUpdateData,
	): NormalizedWhatsAppEvent[] {
		const eventType = CONNECTION_STATUS_MAP[data.status];
		if (!eventType) {
			return [];
		}

		return [
			{
				type: eventType,
				source: "WEBHOOK",
				instanceId: raw.instance_id || raw.instance,
				occurredAt: new Date(raw.timestamp),
				isGroup: false,
				metadata: {
					status: data.status,
					phoneNumber: data.phone_number,
					profileName: data.profile_name,
				},
			},
		];
	}

	// ─────────────────────────────────────────────────────────────────────────
	// HELPERS
	// ─────────────────────────────────────────────────────────────────────────

	private createBaseEvent(
		raw: TurboZapWebhookPayload,
		type: WhatsAppEventType,
	): NormalizedWhatsAppEvent {
		return {
			type,
			source: "WEBHOOK",
			instanceId: raw.instance_id || raw.instance,
			occurredAt: new Date(raw.timestamp),
			isGroup: false,
			metadata: {},
		};
	}
}

// Export singleton instance
export const turboZapTransformer = new TurboZapWebhookTransformer();

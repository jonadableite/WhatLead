/**
 * Webhook Event Handler Interface
 *
 * This module defines the normalized event format for WhatsApp webhooks.
 * All provider-specific webhook payloads are transformed into this format
 * before being processed by the domain.
 *
 * DESIGN PRINCIPLES:
 * - Raw webhook payloads are transformed to normalized events
 * - Domain never sees provider-specific structures
 * - ML-ready: all events have consistent, extractable features
 */

// ═══════════════════════════════════════════════════════════════════════════
// NORMALIZED EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalized event types for WhatsApp webhooks.
 * These are domain-level event classifications.
 */
export const WHATSAPP_EVENT_TYPES = [
	// Message lifecycle
	"MESSAGE_SENT",
	"MESSAGE_RECEIVED",
	"MESSAGE_DELIVERED",
	"MESSAGE_READ",
	"MESSAGE_FAILED",

	// Engagement
	"REACTION_SENT",
	"REACTION_RECEIVED",
	"PRESENCE_SET",

	// Risk signals
	"BLOCK_DETECTED",
	"DELIVERY_FAILURE",
	"RATE_LIMIT_HIT",

	// Connection
	"CONNECTION_CONNECTED",
	"CONNECTION_DISCONNECTED",
	"CONNECTION_QRCODE",
	"CONNECTION_ERROR",

	// Groups
	"GROUP_JOINED",
	"GROUP_LEFT",
	"GROUP_MESSAGE_RECEIVED",
] as const;

export type WhatsAppEventType = (typeof WHATSAPP_EVENT_TYPES)[number];

export const WHATSAPP_EVENT_SOURCES = ["WEBHOOK", "DISPATCH", "PROVIDER"] as const;
export type WhatsAppEventSource = (typeof WHATSAPP_EVENT_SOURCES)[number];

// ═══════════════════════════════════════════════════════════════════════════
// NORMALIZED EVENT STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalized WhatsApp event.
 * This is the only event format the domain/application layers should handle.
 *
 * Provider-specific handlers transform raw webhooks into this format.
 */
export interface NormalizedWhatsAppEvent {
	/**
	 * Event type (domain classification).
	 */
	type: WhatsAppEventType;

	/**
	 * Origin of the event (webhook vs runtime).
	 */
	source: WhatsAppEventSource;

	/**
	 * WhatsApp instance identifier.
	 */
	instanceId: string;

	/**
	 * When the event occurred (from provider or received time).
	 */
	occurredAt: Date;

	/**
	 * Provider-assigned message ID (if applicable).
	 */
	messageId?: string;

	/**
	 * Remote party (sender or recipient).
	 */
	remoteJid?: string;

	/**
	 * Whether this is a group event.
	 */
	isGroup: boolean;

	/**
	 * Latency in milliseconds (e.g., time to deliver).
	 */
	latencyMs?: number;

	/**
	 * Additional metadata (provider-specific, for debugging/ML).
	 * Keep this minimal and non-sensitive.
	 */
	metadata: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK EVENT HANDLER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Handler for normalized WhatsApp webhook events.
 * Implementations update metrics, trigger evaluations, emit domain events.
 */
export interface WebhookEventHandler {
	/**
	 * Handles a normalized webhook event.
	 * This method should be idempotent.
	 *
	 * @param event - Normalized event from any provider
	 */
	handle(event: NormalizedWhatsAppEvent): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TRANSFORMER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transforms raw provider webhook payloads into normalized events.
 * Each provider implements this to handle its specific payload format.
 */
export interface WebhookEventTransformer<TRawPayload = unknown> {
	/**
	 * Provider name for logging.
	 */
	readonly providerName: string;

	/**
	 * Transforms a raw webhook payload into normalized events.
	 * A single webhook may produce multiple events.
	 *
	 * @param raw - Raw webhook payload from the provider
	 * @returns Array of normalized events (empty if payload is irrelevant)
	 */
	transform(raw: TRawPayload): NormalizedWhatsAppEvent[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Checks if an event type is message-related.
 */
export const isMessageEvent = (type: WhatsAppEventType): boolean =>
	type.startsWith("MESSAGE_");

/**
 * Checks if an event type indicates a risk signal.
 */
export const isRiskEvent = (type: WhatsAppEventType): boolean =>
	type === "BLOCK_DETECTED" || type === "DELIVERY_FAILURE";

/**
 * Checks if an event type is connection-related.
 */
export const isConnectionEvent = (type: WhatsAppEventType): boolean =>
	type.startsWith("CONNECTION_");

/**
 * Checks if an event type is engagement-related (positive signal).
 */
export const isEngagementEvent = (type: WhatsAppEventType): boolean =>
	type === "MESSAGE_RECEIVED" ||
	type === "MESSAGE_READ" ||
	type === "REACTION_RECEIVED" ||
	type === "GROUP_MESSAGE_RECEIVED";

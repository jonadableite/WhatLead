/**
 * WhatsApp Provider Interface
 *
 * This is the main contract for WhatsApp integrations.
 * The domain layer uses this interface without knowing the underlying engine.
 *
 * DESIGN PRINCIPLES:
 * - Provider is "dumb" - no business logic, no retry, no rate limiting
 * - All intelligence lives in use cases and domain services
 * - Capabilities are split into separate interfaces for gradual adoption
 */

import type {
	ConnectionResult,
	GroupInfo,
	InstanceStatusInfo,
	MarkAsReadParams,
	MessageResult,
	QRCodeResult,
	SendAudioParams,
	SendMediaParams,
	SendReactionParams,
	SendTextParams,
	SetPresenceParams,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// CORE PROVIDER INTERFACE (Required for all providers)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Core WhatsApp provider capabilities.
 * Every provider MUST implement this interface.
 */
export interface WhatsAppProvider {
	/**
	 * Provider identifier for logging and debugging.
	 */
	readonly providerName: string;

	// ─────────────────────────────────────────────────────────────────────────
	// Connection Management
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Initiates connection to WhatsApp for the instance.
	 * May return a QR code that needs to be scanned.
	 */
	connect(instanceId: string): Promise<ConnectionResult>;

	/**
	 * Disconnects the instance from WhatsApp.
	 * Session data may be preserved for reconnection.
	 */
	disconnect(instanceId: string): Promise<void>;

	/**
	 * Gets the current status of the instance.
	 */
	getStatus(instanceId: string): Promise<InstanceStatusInfo>;

	/**
	 * Gets the QR code for connection (if in QRCODE state).
	 */
	getQRCode(instanceId: string): Promise<QRCodeResult>;

	// ─────────────────────────────────────────────────────────────────────────
	// Messaging (Core)
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Sends a text message.
	 */
	sendText(params: SendTextParams): Promise<MessageResult>;

	/**
	 * Sends a media message (image, video, document).
	 */
	sendMedia(params: SendMediaParams): Promise<MessageResult>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY INTERFACES (Optional - check with type guards)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Provider supports presence/typing indicators.
 * Essential for human-like behavior during warming.
 */
export interface WhatsAppPresenceCapable {
	/**
	 * Sets presence status (available, composing, recording).
	 */
	setPresence(params: SetPresenceParams): Promise<void>;

	/**
	 * Marks a message as read (blue ticks).
	 */
	markAsRead(params: MarkAsReadParams): Promise<void>;
}

/**
 * Provider supports reaction emojis.
 * Important for engagement simulation.
 */
export interface WhatsAppReactionCapable {
	/**
	 * Sends a reaction emoji to a message.
	 */
	sendReaction(params: SendReactionParams): Promise<MessageResult>;
}

/**
 * Provider supports audio/voice messages.
 * Important for human-like communication.
 */
export interface WhatsAppAudioCapable {
	/**
	 * Sends an audio or voice message.
	 */
	sendAudio(params: SendAudioParams): Promise<MessageResult>;
}

/**
 * Provider supports group operations.
 * Used for warming through group interactions.
 */
export interface WhatsAppGroupCapable {
	/**
	 * Lists all groups the instance is part of.
	 */
	listGroups(instanceId: string): Promise<GroupInfo[]>;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS (for checking capabilities)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Checks if provider supports presence features.
 */
export const isPresenceCapable = (
	provider: WhatsAppProvider,
): provider is WhatsAppProvider & WhatsAppPresenceCapable => {
	return "setPresence" in provider && "markAsRead" in provider;
};

/**
 * Checks if provider supports reactions.
 */
export const isReactionCapable = (
	provider: WhatsAppProvider,
): provider is WhatsAppProvider & WhatsAppReactionCapable => {
	return "sendReaction" in provider;
};

/**
 * Checks if provider supports audio messages.
 */
export const isAudioCapable = (
	provider: WhatsAppProvider,
): provider is WhatsAppProvider & WhatsAppAudioCapable => {
	return "sendAudio" in provider;
};

/**
 * Checks if provider supports group operations.
 */
export const isGroupCapable = (
	provider: WhatsAppProvider,
): provider is WhatsAppProvider & WhatsAppGroupCapable => {
	return "listGroups" in provider;
};

// ═══════════════════════════════════════════════════════════════════════════
// FULL-FEATURED PROVIDER (convenience type)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A provider that implements all capabilities.
 * Used when you need a fully-featured provider.
 */
export type FullFeaturedWhatsAppProvider = WhatsAppProvider &
	WhatsAppPresenceCapable &
	WhatsAppReactionCapable &
	WhatsAppAudioCapable &
	WhatsAppGroupCapable;

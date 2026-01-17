/**
 * Shared types for WhatsApp providers.
 * These are DTOs used across the application layer.
 *
 * IMPORTANT: Domain types (WhatsAppEngine, InstanceConnectionStatus) are imported,
 * never redefined here.
 */

// Re-export domain types for convenience
export type { InstanceConnectionStatus } from "../../domain/value-objects/instance-connection-status";
export type { WhatsAppEngine } from "../../domain/value-objects/whatsapp-engine";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Configuration for a WhatsApp provider.
 */
export interface ProviderConfig {
	/** Base URL of the provider API */
	baseUrl: string;
	/** API key for authentication */
	apiKey: string;
	/** Request timeout in milliseconds */
	timeoutMs?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parameters for sending a text message.
 */
export interface SendTextParams {
	/** Instance identifier */
	instanceId: string;
	/** Recipient phone number (with country code, e.g., 5511999999999) */
	to: string;
	/** Message text content */
	text: string;
	/** Optional delay before sending (human-like behavior) */
	delayMs?: number;
}

/**
 * Parameters for sending media (image, video, document).
 */
export interface SendMediaParams {
	/** Instance identifier */
	instanceId: string;
	/** Recipient phone number */
	to: string;
	/** URL of the media file */
	mediaUrl?: string;
	/** Base64-encoded media (alternative to mediaUrl) */
	base64?: string;
	/** MIME type of the media */
	mimeType?: string;
	/** Optional caption for the media */
	caption?: string;
}

/**
 * Parameters for sending a reaction emoji.
 */
export interface SendReactionParams {
	/** Instance identifier */
	instanceId: string;
	/** Recipient phone number */
	to: string;
	/** ID of the message to react to */
	messageId: string;
	/** Emoji to react with */
	emoji: string;
}

/**
 * Parameters for sending audio/voice message.
 */
export interface SendAudioParams {
	/** Instance identifier */
	instanceId: string;
	/** Recipient phone number */
	to: string;
	/** URL of the audio file */
	mediaUrl?: string;
	/** Base64-encoded audio */
	base64?: string;
	/** If true, sends as voice message (PTT) */
	ptt?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESENCE PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Presence state types.
 */
export type PresenceType = "available" | "unavailable" | "composing" | "recording";

/**
 * Parameters for setting presence status.
 */
export interface SetPresenceParams {
	/** Instance identifier */
	instanceId: string;
	/** Contact phone number */
	to: string;
	/** Presence type to set */
	presence: PresenceType;
}

/**
 * Parameters for marking a message as read.
 */
export interface MarkAsReadParams {
	/** Instance identifier */
	instanceId: string;
	/** ID of the message to mark as read */
	messageId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Result of a message send operation.
 */
export interface MessageResult {
	/** Whether the send was successful */
	success: boolean;
	/** Provider-assigned message ID */
	messageId?: string;
	/** Timestamp when the message was sent */
	timestamp?: Date;
	/** Error message if failed */
	error?: string;
	/** Provider error code if failed (e.g., HTTP_429) */
	errorCode?: string;
}

/**
 * Result of a connection operation.
 */
export interface ConnectionResult {
	/** Whether connection was successful */
	success: boolean;
	/** QR code data (if waiting for scan) */
	qrCode?: string;
	/** Current status after operation */
	status: import("../../domain/value-objects/instance-connection-status").InstanceConnectionStatus;
	/** Error message if failed */
	error?: string;
}

/**
 * Result of QR code request.
 */
export interface QRCodeResult {
	/** QR code as base64 data URL */
	qrCode: string;
	/** Expiration timestamp */
	expiresAt?: Date;
}

/**
 * Detailed instance status information.
 */
export interface InstanceStatusInfo {
	/** Current connection status */
	status: import("../../domain/value-objects/instance-connection-status").InstanceConnectionStatus;
	/** Connected phone number (if connected) */
	phoneNumber?: string;
	/** Profile name (if connected) */
	profileName?: string;
	/** Profile picture URL */
	profilePicUrl?: string;
	/** Last seen timestamp */
	lastSeenAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Basic group information.
 */
export interface GroupInfo {
	/** Group JID (e.g., 120363123456789012@g.us) */
	id: string;
	/** Group name */
	name: string;
	/** Number of participants */
	participantsCount: number;
}

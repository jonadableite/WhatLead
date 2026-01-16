/**
 * Connection status of a WhatsApp instance.
 * Used across domain and application layers.
 */
export const INSTANCE_STATUSES = [
	"DISCONNECTED",
	"CONNECTING",
	"QRCODE",
	"CONNECTED",
	"ERROR",
] as const;

export type InstanceStatus = (typeof INSTANCE_STATUSES)[number];

/**
 * Checks if the instance is in a usable state for messaging.
 */
export const isConnected = (status: InstanceStatus): boolean =>
	status === "CONNECTED";

/**
 * Checks if the instance is in a transitional state.
 */
export const isTransitioning = (status: InstanceStatus): boolean =>
	status === "CONNECTING" || status === "QRCODE";

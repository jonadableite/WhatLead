export const INSTANCE_CONNECTION_STATUSES = [
	"DISCONNECTED",
	"CONNECTING",
	"QRCODE",
	"CONNECTED",
	"ERROR",
] as const;

export type InstanceConnectionStatus =
	(typeof INSTANCE_CONNECTION_STATUSES)[number];

export const isValidInstanceConnectionStatus = (
	value: string,
): value is InstanceConnectionStatus =>
	INSTANCE_CONNECTION_STATUSES.includes(value as InstanceConnectionStatus);

export const isConnected = (status: InstanceConnectionStatus): boolean =>
	status === "CONNECTED";

export const isTransitioning = (status: InstanceConnectionStatus): boolean =>
	status === "CONNECTING" || status === "QRCODE";


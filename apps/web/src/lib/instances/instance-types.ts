export type InstanceRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type InstanceLifecycleStatus = "CREATED" | "ACTIVE" | "COOLDOWN" | "BANNED";

export type InstanceConnectionStatus =
	| "DISCONNECTED"
	| "CONNECTING"
	| "QRCODE"
	| "CONNECTED"
	| "ERROR";

export type InstancePurpose = "WARMUP" | "DISPATCH" | "MIXED";

export type WhatsAppEngine = "TURBOZAP" | "EVOLUTION";

export type InstanceAllowedAction =
	| "VIEW_HEALTH"
	| "CONNECT"
	| "RECONNECT"
	| "ENTER_COOLDOWN"
	| "ALLOW_DISPATCH"
	| "BLOCK_DISPATCH"
	| "ALERT";

export interface InstanceListItem {
	id: string;
	name: string;
	numberMasked: string;
	purpose: InstancePurpose;
	engine: WhatsAppEngine;
	lifecycleStatus: InstanceLifecycleStatus;
	connectionStatus: InstanceConnectionStatus;
	riskLevel: InstanceRiskLevel;
	allowedActions: readonly InstanceAllowedAction[];
	healthLabel: string;
}

export interface ListInstancesResponse {
	items: InstanceListItem[];
}

export interface CreateInstanceResponse {
	instance: InstanceListItem;
}

export interface GetInstanceResponse {
	instance: InstanceListItem;
}

export interface InstanceHealthResponse {
	instance: InstanceListItem;
	health: {
		status: {
			lifecycle: InstanceLifecycleStatus;
			connection: InstanceConnectionStatus;
		};
		reputationScore: number;
		temperatureLevel: string;
		riskLevel: InstanceRiskLevel;
		alerts: readonly string[];
		actions: readonly InstanceAllowedAction[];
		warmUpPhase: string;
		cooldownReason: string | null;
		signalsSnapshot: Record<string, unknown>;
	};
}

export interface InstanceConnectionInfo {
	status: InstanceConnectionStatus;
	phoneNumber?: string;
	profileName?: string;
	profilePicUrl?: string;
}

export interface InstanceConnectionStatusResponse {
	instance: InstanceListItem;
	connection: InstanceConnectionInfo;
}

export interface InstanceQRCodeResponse {
	qrCode: string;
}

export interface ConnectInstanceResponse {
	instance: InstanceListItem;
	connection: {
		success: boolean;
		status: InstanceConnectionStatus;
		qrCode: string | null;
		error: string | null;
	};
}

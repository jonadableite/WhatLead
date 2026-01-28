import type { Instance } from "../../domain/entities/instance";
import type { InstanceConnectionStatus } from "../../domain/value-objects/instance-connection-status";
import type { InstanceHealthAction } from "../../domain/value-objects/instance-health-action";
import type { InstanceLifecycleStatus } from "../../domain/value-objects/instance-lifecycle-status";
import type { InstancePurpose } from "../../domain/value-objects/instance-purpose";
import type { WhatsAppEngine } from "../../domain/value-objects/whatsapp-engine";

export interface InstanceListItemViewModel {
	id: string;
	name: string;
	profileName: string | null;
	profilePicUrl: string | null;
	profileLastSyncAt: string | null;
	numberMasked: string;
	purpose: InstancePurpose;
	engine: WhatsAppEngine;
	lifecycleStatus: InstanceLifecycleStatus;
	connectionStatus: InstanceConnectionStatus;
	riskLevel: "LOW" | "MEDIUM" | "HIGH";
	allowedActions: readonly InstanceHealthAction[];
	healthLabel: string;
}

export const toInstanceListItemViewModel = (
	instance: Instance,
	now: Date,
): InstanceListItemViewModel => {
	const actions = instance.allowedActions(now);
	const risk = instance.reputation.getRiskLevel().toUpperCase() as "LOW" | "MEDIUM" | "HIGH";

	return {
		id: instance.id,
		name: instance.displayName,
		profileName: instance.profileName,
		profilePicUrl: instance.profilePicUrl,
		profileLastSyncAt: instance.profileLastSyncAt
			? instance.profileLastSyncAt.toISOString()
			: null,
		numberMasked: instance.maskedPhoneNumber,
		purpose: instance.purpose,
		engine: instance.engine,
		lifecycleStatus: instance.lifecycleStatus,
		connectionStatus: instance.connectionStatus,
		riskLevel: risk,
		allowedActions: actions,
		healthLabel: healthLabelFrom(instance, now),
	};
};

const healthLabelFrom = (instance: Instance, now: Date): string => {
	if (instance.lifecycleStatus === "BANNED") return "Bloqueada";
	if (instance.lifecycleStatus === "COOLDOWN") return "Em cooldown";
	if (instance.connectionStatus === "CONNECTING") return "Conectando...";
	if (instance.lifecycleStatus === "CREATED" && instance.connectionStatus === "DISCONNECTED") {
		return "Instância criada, aguardando conexão";
	}
	if (instance.canWarmUp()) return "Apta para aquecer";
	if (instance.allowedActions(now).includes("ALLOW_DISPATCH")) return "Apta para disparo";
	return "Bloqueada";
};


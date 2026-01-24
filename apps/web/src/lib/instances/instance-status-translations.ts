import type {
	InstanceConnectionStatus,
	InstanceLifecycleStatus,
	InstancePurpose,
	InstanceRiskLevel,
} from "./instance-types";

export const translateConnectionStatus = (
	status: InstanceConnectionStatus,
): string =>
	({
		DISCONNECTED: "Desconectada",
		CONNECTING: "Conectando...",
		QRCODE: "Aguardando leitura do QR Code",
		CONNECTED: "Conectada",
		ERROR: "Erro de conexão",
	})[status] ?? status;

export const translateLifecycleStatus = (status: InstanceLifecycleStatus): string =>
	({
		CREATED: "Criada",
		ACTIVE: "Ativa",
		COOLDOWN: "Em resfriamento",
		BANNED: "Banida",
	})[status] ?? status;

export const translatePurpose = (purpose: InstancePurpose): string =>
	({
		WARMUP: "Aquecimento",
		DISPATCH: "Disparo",
		MIXED: "Misto",
	})[purpose] ?? purpose;

export const translateRiskLevel = (risk: InstanceRiskLevel): string =>
	({
		LOW: "Baixo",
		MEDIUM: "Médio",
		HIGH: "Alto",
	})[risk] ?? risk;

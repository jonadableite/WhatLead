import type { WhatsAppProvider } from "../providers/whatsapp-provider";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { InstanceConnectionStatus } from "../../domain/value-objects/instance-connection-status";
import { toInstanceListItemViewModel, type InstanceListItemViewModel } from "./instance-view-model";
import { getProviderInstanceName } from "./provider-instance-name";

export type InstanceConnectionIntent = "CONNECT" | "RECONNECT";

export interface ConnectInstanceUseCaseRequest {
	companyId: string;
	instanceId: string;
	intent: InstanceConnectionIntent;
	now?: Date;
}

export interface ConnectInstanceUseCaseResponse {
	instance: InstanceListItemViewModel;
	connection: {
		success: boolean;
		status: InstanceConnectionStatus;
		qrCode: string | null;
		error: string | null;
	};
}

export class ConnectInstanceUseCase {
	constructor(
		private readonly instances: InstanceRepository,
		private readonly provider: WhatsAppProvider,
	) {}

	async execute(request: ConnectInstanceUseCaseRequest): Promise<ConnectInstanceUseCaseResponse> {
		const now = request.now ?? new Date();
		const instance = await this.instances.findById(request.instanceId);
		if (!instance || instance.companyId !== request.companyId) {
			throw new Error("INSTANCE_NOT_FOUND");
		}

		const providerName = getProviderInstanceName(instance);
		const result = await this.provider.connect(providerName);

		if (!result.success) {
			instance.markError();
			await this.instances.save(instance);
			return {
				instance: toInstanceListItemViewModel(instance, now),
				connection: {
					success: false,
					status: "ERROR",
					qrCode: null,
					error: result.error ?? "Falha ao conectar",
				},
			};
		}

		applyProviderStatus(instance, result.status);
		await this.instances.save(instance);

		return {
			instance: toInstanceListItemViewModel(instance, now),
			connection: {
				success: true,
				status: result.status,
				qrCode: result.qrCode ?? null,
				error: null,
			},
		};
	}
}

const applyProviderStatus = (
	instance: {
		markConnected: () => void;
		markConnecting: () => void;
		markDisconnected: () => void;
		markQRCode: () => void;
		markError: () => void;
	},
	status: InstanceConnectionStatus,
): void => {
	switch (status) {
		case "CONNECTED":
			instance.markConnected();
			return;
		case "CONNECTING":
			instance.markConnecting();
			return;
		case "QRCODE":
			instance.markQRCode();
			return;
		case "ERROR":
			instance.markError();
			return;
		case "DISCONNECTED":
		default:
			instance.markDisconnected();
	}
};

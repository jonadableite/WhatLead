import type { WhatsAppProvider } from "../providers/whatsapp-provider";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { InstanceConnectionStatus } from "../../domain/value-objects/instance-connection-status";
import { toInstanceListItemViewModel, type InstanceListItemViewModel } from "./instance-view-model";

export interface GetInstanceConnectionStatusUseCaseRequest {
	companyId: string;
	instanceId: string;
	now?: Date;
}

export interface GetInstanceConnectionStatusUseCaseResponse {
	instance: InstanceListItemViewModel;
	connection: {
		status: InstanceConnectionStatus;
		phoneNumber?: string;
		profileName?: string;
		profilePicUrl?: string;
	};
}

export class GetInstanceConnectionStatusUseCase {
	constructor(
		private readonly instances: InstanceRepository,
		private readonly provider: WhatsAppProvider,
	) {}

	async execute(
		request: GetInstanceConnectionStatusUseCaseRequest,
	): Promise<GetInstanceConnectionStatusUseCaseResponse> {
		const now = request.now ?? new Date();
		const instance = await this.instances.findById(request.instanceId);
		if (!instance || instance.companyId !== request.companyId) {
			throw new Error("INSTANCE_NOT_FOUND");
		}

		const status = await this.provider.getStatus(instance.id);
		applyProviderStatus(instance, status.status);
		await this.instances.save(instance);

		return {
			instance: toInstanceListItemViewModel(instance, now),
			connection: {
				status: status.status,
				phoneNumber: status.phoneNumber,
				profileName: status.profileName,
				profilePicUrl: status.profilePicUrl,
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


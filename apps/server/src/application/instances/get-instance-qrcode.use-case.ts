import type { WhatsAppProvider } from "../providers/whatsapp-provider";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import { getProviderInstanceName } from "./provider-instance-name";

export interface GetInstanceQRCodeUseCaseRequest {
	companyId: string;
	instanceId: string;
}

export interface GetInstanceQRCodeUseCaseResponse {
	qrCode: string;
}

export class GetInstanceQRCodeUseCase {
	constructor(
		private readonly instances: InstanceRepository,
		private readonly provider: WhatsAppProvider,
	) {}

	async execute(request: GetInstanceQRCodeUseCaseRequest): Promise<GetInstanceQRCodeUseCaseResponse> {
		const instance = await this.instances.findById(request.instanceId);
		if (!instance || instance.companyId !== request.companyId) {
			throw new Error("INSTANCE_NOT_FOUND");
		}

		const providerName = getProviderInstanceName(instance);
		const { qrCode } = await this.provider.getQRCode(providerName);
		return { qrCode };
	}
}


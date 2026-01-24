import type { WhatsAppProvider } from "../providers/whatsapp-provider";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";

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

		const { qrCode } = await this.provider.getQRCode(instance.id);
		return { qrCode };
	}
}


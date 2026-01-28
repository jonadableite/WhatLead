import type { InstanceRepository } from "../../domain/repositories/instance-repository";

export interface DeleteInstanceUseCaseRequest {
	companyId: string;
	instanceId: string;
}

export class DeleteInstanceUseCase {
	constructor(private readonly instances: InstanceRepository) {}

	async execute(request: DeleteInstanceUseCaseRequest): Promise<void> {
		const instance = await this.instances.findById(request.instanceId);
		if (!instance || instance.companyId !== request.companyId) {
			throw new Error("INSTANCE_NOT_FOUND");
		}

		await this.instances.delete(instance.id);
	}
}

import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import {
	toInstanceListItemViewModel,
	type InstanceListItemViewModel,
} from "./instance-view-model";

export interface GetInstanceUseCaseRequest {
	companyId: string;
	instanceId: string;
	now?: Date;
}

export interface GetInstanceUseCaseResponse {
	instance: InstanceListItemViewModel;
}

export class GetInstanceUseCase {
	constructor(private readonly instances: InstanceRepository) {}

	async execute(request: GetInstanceUseCaseRequest): Promise<GetInstanceUseCaseResponse> {
		const now = request.now ?? new Date();
		const instance = await this.instances.findById(request.instanceId);
		if (!instance || instance.companyId !== request.companyId) {
			throw new Error("INSTANCE_NOT_FOUND");
		}
		return { instance: toInstanceListItemViewModel(instance, now) };
	}
}


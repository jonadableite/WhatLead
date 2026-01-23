import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import {
	toInstanceListItemViewModel,
	type InstanceListItemViewModel,
} from "./instance-view-model";

export interface ListInstancesUseCaseRequest {
	companyId: string;
	now?: Date;
}

export interface ListInstancesUseCaseResponse {
	items: InstanceListItemViewModel[];
}

export class ListInstancesUseCase {
	constructor(private readonly instances: InstanceRepository) {}

	async execute(
		request: ListInstancesUseCaseRequest,
	): Promise<ListInstancesUseCaseResponse> {
		const now = request.now ?? new Date();
		const instances = await this.instances.listByCompanyId(request.companyId);
		return { items: instances.map((i) => toInstanceListItemViewModel(i, now)) };
	}
}


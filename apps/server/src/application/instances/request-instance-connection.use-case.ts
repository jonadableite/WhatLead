import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import {
	toInstanceListItemViewModel,
	type InstanceListItemViewModel,
} from "./instance-view-model";

export type InstanceConnectionIntent = "CONNECT" | "RECONNECT";

export interface RequestInstanceConnectionUseCaseRequest {
	companyId: string;
	instanceId: string;
	intent: InstanceConnectionIntent;
	now?: Date;
}

export interface RequestInstanceConnectionUseCaseResponse {
	instance: InstanceListItemViewModel;
}

export class RequestInstanceConnectionUseCase {
	constructor(private readonly instances: InstanceRepository) {}

	async execute(
		request: RequestInstanceConnectionUseCaseRequest,
	): Promise<RequestInstanceConnectionUseCaseResponse> {
		const now = request.now ?? new Date();
		const instance = await this.instances.findById(request.instanceId);
		if (!instance || instance.companyId !== request.companyId) {
			throw new Error("INSTANCE_NOT_FOUND");
		}

		instance.markConnecting();
		await this.instances.save(instance);

		return { instance: toInstanceListItemViewModel(instance, now) };
	}
}


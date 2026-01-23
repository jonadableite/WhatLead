import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { EvaluateInstanceHealthUseCaseResponse } from "../../domain/use-cases/evaluate-instance-health";
import { toInstanceListItemViewModel, type InstanceListItemViewModel } from "./instance-view-model";

export interface EvaluateInstanceHealthOnDemandUseCaseRequest {
	companyId: string;
	instanceId: string;
	now?: Date;
}

export interface EvaluateInstanceHealthOnDemandUseCaseResponse {
	instance: InstanceListItemViewModel;
	health: EvaluateInstanceHealthUseCaseResponse;
}

export class EvaluateInstanceHealthOnDemandUseCase {
	constructor(
		private readonly instances: InstanceRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
	) {}

	async execute(
		request: EvaluateInstanceHealthOnDemandUseCaseRequest,
	): Promise<EvaluateInstanceHealthOnDemandUseCaseResponse> {
		const now = request.now ?? new Date();
		const instance = await this.instances.findById(request.instanceId);
		if (!instance || instance.companyId !== request.companyId) {
			throw new Error("INSTANCE_NOT_FOUND");
		}

		const health = await this.evaluateInstanceHealth.execute({
			instanceId: request.instanceId,
			reason: "CRON",
			now,
		});

		const updated = await this.instances.findById(request.instanceId);
		if (!updated) {
			throw new Error("INSTANCE_NOT_FOUND");
		}

		return {
			instance: toInstanceListItemViewModel(updated, now),
			health,
		};
	}
}


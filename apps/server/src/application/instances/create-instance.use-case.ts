import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { InstanceReputationRepository } from "../../domain/repositories/instance-reputation-repository";
import type { InstancePurpose } from "../../domain/value-objects/instance-purpose";
import type { WhatsAppEngine } from "../../domain/value-objects/whatsapp-engine";
import { toInstanceListItemViewModel, type InstanceListItemViewModel } from "./instance-view-model";

export interface CreateInstanceUseCaseRequest {
	companyId: string;
	displayName: string;
	phoneNumber: string;
	purpose: InstancePurpose;
	engine: WhatsAppEngine;
	now?: Date;
}

export interface CreateInstanceUseCaseResponse {
	instance: InstanceListItemViewModel;
}

export class CreateInstanceUseCase {
	constructor(
		private readonly instances: InstanceRepository,
		private readonly reputations: InstanceReputationRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(
		request: CreateInstanceUseCaseRequest,
	): Promise<CreateInstanceUseCaseResponse> {
		const now = request.now ?? new Date();
		const id = this.idFactory.createId();

		const reputation = InstanceReputation.initialize(id);
		const instance = Instance.initialize({
			id,
			companyId: request.companyId,
			engine: request.engine,
			purpose: request.purpose,
			displayName: request.displayName,
			phoneNumber: request.phoneNumber,
			reputation,
		});

		await this.instances.create(instance);
		await this.reputations.save(reputation);

		return { instance: toInstanceListItemViewModel(instance, now) };
	}
}


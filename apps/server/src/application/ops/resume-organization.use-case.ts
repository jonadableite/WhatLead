import { ExecutionControl } from "../../domain/entities/execution-control";
import type { ExecutionControlRepository } from "../../domain/repositories/execution-control-repository";

export interface ResumeOrganizationUseCaseRequest {
	organizationId: string;
	now?: Date;
}

export class ResumeOrganizationUseCase {
	constructor(
		private readonly controls: ExecutionControlRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(request: ResumeOrganizationUseCaseRequest): Promise<void> {
		const now = request.now ?? new Date();
		const existing = await this.controls.findByScope("ORGANIZATION", request.organizationId);
		const control =
			existing ??
			ExecutionControl.create({
				id: this.idFactory.createId(),
				scope: "ORGANIZATION",
				scopeId: request.organizationId,
				now,
			});
		control.resume({ now });
		await this.controls.upsert(control);
	}
}


import { ExecutionControl } from "../../domain/entities/execution-control";
import type { ExecutionControlRepository } from "../../domain/repositories/execution-control-repository";

export interface PauseOrganizationUseCaseRequest {
	organizationId: string;
	reason?: string;
	until?: Date | null;
	now?: Date;
}

export class PauseOrganizationUseCase {
	constructor(
		private readonly controls: ExecutionControlRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(request: PauseOrganizationUseCaseRequest): Promise<void> {
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

		control.pause({ reason: request.reason, until: request.until ?? null, now });
		await this.controls.upsert(control);
	}
}


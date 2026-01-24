import { ExecutionControl } from "../../domain/entities/execution-control";
import type { ExecutionControlRepository } from "../../domain/repositories/execution-control-repository";

export interface PauseInstanceUseCaseRequest {
	instanceId: string;
	reason?: string;
	until?: Date | null;
	now?: Date;
}

export class PauseInstanceUseCase {
	constructor(
		private readonly controls: ExecutionControlRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(request: PauseInstanceUseCaseRequest): Promise<void> {
		const now = request.now ?? new Date();
		const existing = await this.controls.findByScope("INSTANCE", request.instanceId);
		const control =
			existing ??
			ExecutionControl.create({
				id: this.idFactory.createId(),
				scope: "INSTANCE",
				scopeId: request.instanceId,
				now,
			});

		control.pause({ reason: request.reason, until: request.until ?? null, now });
		await this.controls.upsert(control);
	}
}


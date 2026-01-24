import { ExecutionControl } from "../../domain/entities/execution-control";
import type { ExecutionControlRepository } from "../../domain/repositories/execution-control-repository";

export interface ResumeInstanceUseCaseRequest {
	instanceId: string;
	now?: Date;
}

export class ResumeInstanceUseCase {
	constructor(
		private readonly controls: ExecutionControlRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(request: ResumeInstanceUseCaseRequest): Promise<void> {
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
		control.resume({ now });
		await this.controls.upsert(control);
	}
}


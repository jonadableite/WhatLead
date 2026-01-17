import type { ReputationSignalRepository } from "../../domain/repositories/reputation-signal-repository";
import type { ReputationSignal } from "../../domain/value-objects/reputation-signal";

export class GetReputationTimelineUseCase {
	constructor(private readonly signals: ReputationSignalRepository) {}

	async execute(params: {
		instanceId: string;
		since: Date;
		until: Date;
	}): Promise<readonly ReputationSignal[]> {
		return await this.signals.getWindow(params);
	}
}


import type { ActiveInstanceIdsProvider } from "../ports/active-instance-ids-provider";
import type { WarmupOrchestratorUseCase } from "./warmup-orchestrator.use-case";

export class WarmupOrchestratorCron {
	constructor(
		private readonly activeInstanceIds: ActiveInstanceIdsProvider,
		private readonly orchestrator: WarmupOrchestratorUseCase,
	) {}

	async run(now: Date = new Date()): Promise<void> {
		const ids = await this.activeInstanceIds.list();
		for (const id of ids) {
			await this.orchestrator.execute(id, now);
		}
	}
}


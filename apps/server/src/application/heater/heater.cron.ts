import type { ActiveInstanceIdsProvider } from "../ports/active-instance-ids-provider";
import type { HeaterUseCase } from "./heater.use-case";

export class HeaterCron {
	constructor(
		private readonly activeInstanceIds: ActiveInstanceIdsProvider,
		private readonly heater: HeaterUseCase,
	) {}

	async run(now: Date = new Date()): Promise<void> {
		const ids = await this.activeInstanceIds.list();
		for (const id of ids) {
			await this.heater.execute(id, now);
		}
	}
}


import type { ActiveInstanceIdsProvider } from "../../ports/active-instance-ids-provider";
import type { EvaluateInstanceHealthUseCase } from "../../../domain/use-cases/evaluate-instance-health";

export class InstanceHealthCronJob {
	constructor(
		private readonly activeInstanceIds: ActiveInstanceIdsProvider,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
	) {}

	async run(now: Date = new Date()): Promise<void> {
		const instanceIds = await this.activeInstanceIds.list();

		for (const instanceId of instanceIds) {
			await this.evaluateInstanceHealth.execute({
				instanceId,
				reason: "CRON",
				now,
			});
		}
	}
}


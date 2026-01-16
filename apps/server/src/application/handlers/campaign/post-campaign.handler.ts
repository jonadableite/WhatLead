import type { EvaluateInstanceHealthUseCase } from "../../../domain/use-cases/evaluate-instance-health";

export class PostCampaignHandler {
	constructor(private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase) {}

	async handle(instanceId: string, now: Date = new Date()): Promise<void> {
		await this.evaluateInstanceHealth.execute({
			instanceId,
			reason: "POST_CAMPAIGN",
			now,
		});
	}
}


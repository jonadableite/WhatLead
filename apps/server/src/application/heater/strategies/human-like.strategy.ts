import type { WarmUpContentProvider } from "../content/warmup-content-provider";
import type { WarmUpTargetsProvider } from "../targets/warmup-targets-provider";
import type { WarmUpPlan, WarmUpStrategy } from "../warmup-strategy";
import type { Instance } from "../../../domain/entities/instance";

export class HumanLikeWarmUpStrategy implements WarmUpStrategy {
	constructor(
		private readonly targets: WarmUpTargetsProvider,
		private readonly content: WarmUpContentProvider,
	) {}

	async plan(params: { instance: Instance; now?: Date }): Promise<WarmUpPlan> {
		const targets = await this.targets.listTargets(params.instance.id);
		if (targets.length === 0) {
			return { actions: [] };
		}

		if (!params.instance.canWarmUp()) {
			return { actions: [] };
		}

		const to = targets[0]!;
		return {
			actions: [
				{
					type: "SEND_TEXT",
					instanceId: params.instance.id,
					to,
					text: this.content.randomText(),
				},
			],
		};
	}
}

import type { Instance } from "../../../domain/entities/instance";
import type { WarmUpPhase } from "../../../domain/value-objects/warmup-phase";
import type { WarmUpContentProvider } from "../content/warmup-content-provider";
import type { WarmUpTargetsProvider } from "../targets/warmup-targets-provider";
import type { WarmUpPlan, WarmUpStrategy } from "../warmup-strategy";

export class HumanLikeWarmUpStrategy implements WarmUpStrategy {
	constructor(
		private readonly targets: WarmUpTargetsProvider,
		private readonly content: WarmUpContentProvider,
	) {}

	async plan(params: {
		instance: Instance;
		phase: WarmUpPhase;
		now?: Date;
	}): Promise<WarmUpPlan> {
		const targets = await this.targets.listTargets(params.instance.id);
		if (targets.length === 0) {
			return { actions: [] };
		}

		if (!params.instance.canWarmUp()) {
			return { actions: [] };
		}

		const to = targets[0]!;

		if (params.phase === "NEWBORN" || params.phase === "OBSERVER") {
			return {
				actions: [
					{
						type: "SET_PRESENCE",
						instanceId: params.instance.id,
						to,
						presence: "composing",
					},
				],
			};
		}

		if (params.phase === "INTERACTING") {
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

		if (params.phase === "SOCIAL" || params.phase === "READY") {
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

		return { actions: [] };
	}
}

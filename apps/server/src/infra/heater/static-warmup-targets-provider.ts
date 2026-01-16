import type { WarmUpTargetsProvider } from "../../application/heater/targets/warmup-targets-provider";

export class StaticWarmUpTargetsProvider implements WarmUpTargetsProvider {
	constructor(private readonly targets: readonly string[] = []) {}

	async listTargets(_instanceId: string): Promise<readonly string[]> {
		return this.targets;
	}
}


export interface WarmUpTargetsProvider {
	listTargets(instanceId: string): Promise<readonly string[]>;
}


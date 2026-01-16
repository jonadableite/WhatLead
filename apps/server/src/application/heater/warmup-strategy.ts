import type { Instance } from "../../domain/entities/instance";
import type { DispatchAction } from "./dispatch-port";

export interface WarmUpPlan {
	readonly actions: readonly DispatchAction[];
}

export interface WarmUpStrategy {
	plan(params: { instance: Instance; now?: Date }): Promise<WarmUpPlan>;
}

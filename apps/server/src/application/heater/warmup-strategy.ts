import type { Instance } from "../../domain/entities/instance";
import type { WarmUpPhase } from "../../domain/value-objects/warmup-phase";
import type { DispatchAction } from "./dispatch-port";

export interface WarmUpPlan {
	readonly actions: readonly DispatchAction[];
}

export interface WarmUpStrategy {
	plan(params: { instance: Instance; phase: WarmUpPhase; now?: Date }): Promise<WarmUpPlan>;
}

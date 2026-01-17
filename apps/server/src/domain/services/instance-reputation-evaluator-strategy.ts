import type { InstanceReputation } from "../entities/instance-reputation";
import type { ReputationSignal } from "../value-objects/reputation-signal";

export interface InstanceReputationEvaluationOutput {
	score: number;
	risk: string;
	temperature: string;
}

export interface InstanceReputationEvaluatorStrategy {
	evaluate(params: {
		instanceId: string;
		reputation: InstanceReputation;
		recentSignals: readonly ReputationSignal[];
		now: Date;
	}): InstanceReputationEvaluationOutput;
}


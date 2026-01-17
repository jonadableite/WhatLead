import type { DispatchGateDecision } from "./dispatch-gate-decision";
import type { DispatchIntent } from "./dispatch-intent";

export interface DispatchGateDecisionRecorderPort {
	record(params: {
		intent: DispatchIntent;
		decision: DispatchGateDecision;
		occurredAt: Date;
	}): Promise<void>;
}


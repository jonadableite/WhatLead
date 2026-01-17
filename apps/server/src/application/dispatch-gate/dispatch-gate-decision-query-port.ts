import type { DispatchGateDecision } from "./dispatch-gate-decision";
import type { DispatchIntent } from "./dispatch-intent";

export interface DispatchGateDecisionRecord {
	intent: DispatchIntent;
	decision: DispatchGateDecision;
	occurredAt: Date;
}

export interface DispatchGateDecisionQueryPort {
	list(params: { since: Date; until: Date; tenantId?: string }): Promise<readonly DispatchGateDecisionRecord[]>;
}


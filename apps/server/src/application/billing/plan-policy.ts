import type { DispatchIntent } from "../dispatch-gate/dispatch-intent";

export interface PlanLimits {
	maxMessagesPerMinute?: number;
	maxMessagesPerHour?: number;
}

export interface PlanPolicy {
	getLimits(params: { tenantId: string; intent: DispatchIntent; now: Date }): Promise<PlanLimits>;
}


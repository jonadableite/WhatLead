import type { DispatchGateDecision } from "../../application/dispatch-gate/dispatch-gate-decision";
import type { DispatchGateDecisionQueryPort } from "../../application/dispatch-gate/dispatch-gate-decision-query-port";
import type { DispatchGateDecisionRecorderPort } from "../../application/dispatch-gate/dispatch-gate-decision-recorder-port";
import type { DispatchIntent } from "../../application/dispatch-gate/dispatch-intent";

export interface RecordedGateDecision {
	readonly intent: DispatchIntent;
	readonly decision: DispatchGateDecision;
	readonly occurredAt: Date;
}

export class InMemoryDispatchGateDecisionRecorder
	implements DispatchGateDecisionRecorderPort, DispatchGateDecisionQueryPort
{
	private readonly items: RecordedGateDecision[] = [];

	async record(params: {
		intent: DispatchIntent;
		decision: DispatchGateDecision;
		occurredAt: Date;
	}): Promise<void> {
		this.items.push({
			intent: params.intent,
			decision: params.decision,
			occurredAt: params.occurredAt,
		});
	}

	async list(params: { since: Date; until: Date; tenantId?: string }): Promise<readonly RecordedGateDecision[]> {
		return this.items.filter((i) => {
			if (i.occurredAt.getTime() < params.since.getTime()) return false;
			if (i.occurredAt.getTime() > params.until.getTime()) return false;
			if (params.tenantId && i.intent.tenantId !== params.tenantId) return false;
			return true;
		});
	}

	listAll(): readonly RecordedGateDecision[] {
		return this.items;
	}
}

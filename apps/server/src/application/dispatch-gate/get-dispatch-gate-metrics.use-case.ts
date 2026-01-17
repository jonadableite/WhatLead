import type { DispatchGateDecisionQueryPort } from "./dispatch-gate-decision-query-port";

export interface DispatchGateMetrics {
	allowed: number;
	blocked: number;
	blockReasons: Record<string, number>;
	delayed: number;
}

export class GetDispatchGateMetricsUseCase {
	constructor(private readonly decisions: DispatchGateDecisionQueryPort) {}

	async execute(params: { since: Date; until: Date; tenantId?: string }): Promise<DispatchGateMetrics> {
		const rows = await this.decisions.list(params);

		let allowed = 0;
		let blocked = 0;
		let delayed = 0;
		const blockReasons: Record<string, number> = {};

		for (const r of rows) {
			if (r.decision.allowed) {
				allowed += 1;
				continue;
			}
			blocked += 1;
			if (r.decision.delayedUntil) {
				delayed += 1;
			}
			const reason = r.decision.reason ?? "UNKNOWN";
			blockReasons[reason] = (blockReasons[reason] ?? 0) + 1;
		}

		return { allowed, blocked, delayed, blockReasons };
	}
}


import type { PlanLimits, PlanPolicy } from "../../application/billing/plan-policy";

export class StaticPlanPolicy implements PlanPolicy {
	constructor(private readonly byTenant: Record<string, PlanLimits> = {}) {}

	async getLimits(params: { tenantId: string }): Promise<PlanLimits> {
		return this.byTenant[params.tenantId] ?? {};
	}
}


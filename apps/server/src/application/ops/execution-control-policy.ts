import type { ExecutionControlRepository } from "../../domain/repositories/execution-control-repository";

export interface ExecutionControlDecision {
	allowed: boolean;
	reason?: string;
	pausedUntil?: Date | null;
}

export class ExecutionControlPolicy {
	constructor(private readonly controls: ExecutionControlRepository) {}

	async isOrganizationPaused(params: {
		organizationId: string;
		now: Date;
	}): Promise<ExecutionControlDecision> {
		const org = await this.controls.findByScope("ORGANIZATION", params.organizationId);
		if (org && org.isPaused(params.now)) {
			return { allowed: false, reason: org.reason ?? "OPS_PAUSED", pausedUntil: org.pausedUntil };
		}
		return { allowed: true };
	}

	async isInstancePaused(params: { instanceId: string; now: Date }): Promise<ExecutionControlDecision> {
		const inst = await this.controls.findByScope("INSTANCE", params.instanceId);
		if (inst && inst.isPaused(params.now)) {
			return { allowed: false, reason: inst.reason ?? "OPS_PAUSED", pausedUntil: inst.pausedUntil };
		}
		return { allowed: true };
	}

	async canExecute(params: {
		organizationId: string;
		instanceId: string;
		now: Date;
	}): Promise<ExecutionControlDecision> {
		const org = await this.isOrganizationPaused({ organizationId: params.organizationId, now: params.now });
		if (!org.allowed) return org;
		return this.isInstancePaused({ instanceId: params.instanceId, now: params.now });
	}
}

export type InstanceDomainEvent =
	| InstanceEnteredCooldownEvent
	| InstanceAtRiskEvent
	| InstanceRecoveredEvent;

export interface InstanceEnteredCooldownEvent {
	type: "InstanceEnteredCooldown";
	occurredAt: Date;
	instanceId: string;
	companyId: string;
}

export interface InstanceAtRiskEvent {
	type: "InstanceAtRisk";
	occurredAt: Date;
	instanceId: string;
	companyId: string;
}

export interface InstanceRecoveredEvent {
	type: "InstanceRecovered";
	occurredAt: Date;
	instanceId: string;
	companyId: string;
}


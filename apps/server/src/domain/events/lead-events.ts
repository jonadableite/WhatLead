export type LeadDomainEvent =
	| { type: "LEAD_STAGE_CHANGED"; leadId: string; from: string; to: string; occurredAt: Date }
	| { type: "LEAD_CREATED"; leadId: string; occurredAt: Date };


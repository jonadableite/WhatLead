export const LEAD_STAGES = [
	"NEW",
	"CONTACTED",
	"QUALIFIED",
	"INTERESTED",
	"PROPOSAL_SENT",
	"NEGOTIATION",
	"WON",
	"LOST",
	"DISCARDED",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

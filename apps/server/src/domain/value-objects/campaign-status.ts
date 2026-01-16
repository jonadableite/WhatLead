export const CAMPAIGN_STATUSES = [
	"DRAFT",
	"SCHEDULED",
	"ACTIVE",
	"PAUSED",
	"FINISHED",
	"CANCELED",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const MESSAGE_INTENT_STATUSES = [
	"PENDING",
	"APPROVED",
	"QUEUED",
	"BLOCKED",
	"DROPPED",
	"SENT",
] as const;

export type MessageIntentStatus = (typeof MESSAGE_INTENT_STATUSES)[number];


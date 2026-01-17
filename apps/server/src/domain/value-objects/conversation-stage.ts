export const CONVERSATION_STAGES = [
	"LEAD",
	"QUALIFIED",
	"PROPOSAL",
	"WON",
	"LOST",
] as const;

export type ConversationStage = (typeof CONVERSATION_STAGES)[number];


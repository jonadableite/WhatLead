export const MESSAGE_INTENT_ORIGINS = [
	"CHAT_MANUAL",
	"CAMPAIGN",
	"AGENT",
	"BOT",
	"WARMUP",
	"SYSTEM",
] as const;

export type MessageIntentOrigin = (typeof MESSAGE_INTENT_ORIGINS)[number];

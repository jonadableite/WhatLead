export const DISPATCH_INTENT_SOURCES = [
	"CAMPAIGN",
	"AGENT",
	"BOT",
	"HUMAN",
	"WARMUP",
] as const;

export type DispatchIntentSource = (typeof DISPATCH_INTENT_SOURCES)[number];


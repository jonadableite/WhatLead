/**
 * Semantic reasons for entering cooldown state.
 * Provides context for analytics, debugging, and ML.
 */
export const COOLDOWN_REASONS = [
	"BLOCK_SPIKE",
	"LOW_REPLY_RATE",
	"DELIVERY_FAILURES",
	"DELIVERY_DROP",
	"SEND_DELAY_SPIKE",
	"CONNECTION_INSTABILITY",
	"MANUAL_INTERVENTION",
	"SCORE_THRESHOLD",
	"OVERHEATED",
] as const;

export type CooldownReason = (typeof COOLDOWN_REASONS)[number];

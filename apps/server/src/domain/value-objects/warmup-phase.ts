export const WARMUP_PHASES = [
	"NEWBORN",
	"OBSERVER",
	"INTERACTING",
	"SOCIAL",
	"READY",
] as const;

export type WarmUpPhase = (typeof WARMUP_PHASES)[number];


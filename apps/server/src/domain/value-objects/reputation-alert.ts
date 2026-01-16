/**
 * Severity levels for reputation alerts.
 * Used by UI, automations, and ML feature extraction.
 */
export const ALERT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

/**
 * Semantic Value Object for reputation alerts.
 * Immutable and self-describing for UI, logs, and ML.
 */
export interface ReputationAlert {
	/** Machine-readable code for programmatic handling */
	readonly code: string;
	/** Human-readable message for UI/logs */
	readonly message: string;
	/** Severity level for prioritization */
	readonly severity: AlertSeverity;
}

/**
 * Well-known alert codes for the reputation system.
 * Centralized for consistency across the domain.
 */
export const REPUTATION_ALERT_CODES = {
	BLOCK_DETECTED: "BLOCK_DETECTED",
	LOW_REPLY_RATE: "LOW_REPLY_RATE",
	HIGH_DELIVERY_FAILURES: "HIGH_DELIVERY_FAILURES",
	OVERHEATED: "OVERHEATED",
	COOLDOWN_REQUIRED: "COOLDOWN_REQUIRED",
	SCORE_DEGRADING: "SCORE_DEGRADING",
	NO_HUMAN_INTERACTION: "NO_HUMAN_INTERACTION",
	RAPID_SCORE_DROP: "RAPID_SCORE_DROP",
} as const;

export type ReputationAlertCode =
	(typeof REPUTATION_ALERT_CODES)[keyof typeof REPUTATION_ALERT_CODES];

/**
 * Factory functions to create well-known alerts.
 * Ensures consistency and type safety.
 */
export const createAlert = {
	blockDetected: (blocksCount: number): ReputationAlert => ({
		code: REPUTATION_ALERT_CODES.BLOCK_DETECTED,
		message: `${blocksCount} block(s) detected. Immediate cooldown recommended.`,
		severity: "CRITICAL",
	}),

	lowReplyRate: (rate: number): ReputationAlert => ({
		code: REPUTATION_ALERT_CODES.LOW_REPLY_RATE,
		message: `Reply rate is ${(rate * 100).toFixed(1)}%, below healthy threshold.`,
		severity: "MEDIUM",
	}),

	highDeliveryFailures: (failures: number): ReputationAlert => ({
		code: REPUTATION_ALERT_CODES.HIGH_DELIVERY_FAILURES,
		message: `${failures} delivery failures detected. Check instance health.`,
		severity: "HIGH",
	}),

	overheated: (): ReputationAlert => ({
		code: REPUTATION_ALERT_CODES.OVERHEATED,
		message: "Instance is overheated due to excessive activity or blocks.",
		severity: "CRITICAL",
	}),

	cooldownRequired: (): ReputationAlert => ({
		code: REPUTATION_ALERT_CODES.COOLDOWN_REQUIRED,
		message: "Instance requires cooldown. Operations paused.",
		severity: "CRITICAL",
	}),

	scoreDegrading: (score: number): ReputationAlert => ({
		code: REPUTATION_ALERT_CODES.SCORE_DEGRADING,
		message: `Reputation score is ${score}, below healthy threshold.`,
		severity: "MEDIUM",
	}),

	noHumanInteraction: (daysSince: number): ReputationAlert => ({
		code: REPUTATION_ALERT_CODES.NO_HUMAN_INTERACTION,
		message: `No human interaction detected for ${daysSince} days.`,
		severity: "LOW",
	}),

	rapidScoreDrop: (drop: number): ReputationAlert => ({
		code: REPUTATION_ALERT_CODES.RAPID_SCORE_DROP,
		message: `Score dropped ${drop} points in last evaluation.`,
		severity: "HIGH",
	}),
};

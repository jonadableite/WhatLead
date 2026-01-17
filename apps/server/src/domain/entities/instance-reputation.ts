import type { CooldownReason } from "../value-objects/cooldown-reason";
import type { InstanceTemperatureLevel } from "../value-objects/instance-temperature-level";
import type { ReputationAlert } from "../value-objects/reputation-alert";
import { createAlert } from "../value-objects/reputation-alert";
import type { TemperatureTrend } from "../value-objects/temperature-trend";
import type { WarmUpPhase } from "../value-objects/warmup-phase";

/**
 * Aggregated signals snapshot for reputation evaluation.
 * Stored in the entity for ML-readiness and persistence.
 * This is a SNAPSHOT, not historical data.
 */
export interface ReputationSignals {
	/** Total messages sent in evaluation window */
	readonly messagesSent: number;
	/** Total messages successfully delivered */
	readonly messagesDelivered: number;
	/** Total messages read */
	readonly messagesRead: number;
	/** Total replies received */
	readonly messagesReplied: number;
	/** Total reactions sent */
	readonly reactionsSent: number;
	/** Total blocks detected (critical signal) */
	readonly messagesBlocked: number;
	/** Human-initiated interactions (not automated) */
	readonly humanInteractions: number;
	/** Group chat participations */
	readonly groupInteractions: number;
	/** Media messages sent (images, audio, video) */
	readonly mediaMessages: number;
	/** Text-only messages sent */
	readonly textMessages: number;
	/** Average reply time in seconds */
	readonly averageReplyTimeInSeconds: number;
	/** Average delivery latency in milliseconds */
	readonly averageDeliveryLatencyMs: number;
	/** Delivery failures count */
	readonly deliveryFailures: number;
	/** Reactions received on messages */
	readonly reactionsReceived: number;
	/** Connection disconnects observed */
	readonly connectionDisconnects: number;
	/** QR code regenerations observed */
	readonly qrcodeRegenerations: number;
	/** Presence set operations observed */
	readonly presenceSets: number;
	/** Rate limit hits observed */
	readonly rateLimitHits: number;
}

/**
 * Default/empty signals for new instances.
 */
const DEFAULT_SIGNALS: ReputationSignals = {
	messagesSent: 0,
	messagesDelivered: 0,
	messagesRead: 0,
	messagesReplied: 0,
	reactionsSent: 0,
	messagesBlocked: 0,
	humanInteractions: 0,
	groupInteractions: 0,
	mediaMessages: 0,
	textMessages: 0,
	averageReplyTimeInSeconds: 0,
	averageDeliveryLatencyMs: 0,
	deliveryFailures: 0,
	reactionsReceived: 0,
	connectionDisconnects: 0,
	qrcodeRegenerations: 0,
	presenceSets: 0,
	rateLimitHits: 0,
};

/**
 * Initial reputation score for new instances.
 */
const INITIAL_SCORE = 50;

/**
 * Minimum cooldown duration in milliseconds (1 hour).
 */
const MIN_COOLDOWN_DURATION_MS = 60 * 60 * 1000;

/**
 * InstanceReputation - Aggregate Root for WhatsApp instance reputation management.
 *
 * This entity is the single source of truth for:
 * - Instance health state
 * - Dispatch eligibility
 * - Temperature/warming status
 * - ML feature storage
 *
 * INVARIANTS:
 * - Score is always 0-100
 * - Temperature is derived from score (never input directly)
 * - Signals are snapshot data (not historical)
 * - Cooldown state blocks all dispatches
 */
export class InstanceReputation {
	private _score: number;
	private _temperatureLevel: InstanceTemperatureLevel;
	private _trend: TemperatureTrend;
	private _alerts: ReputationAlert[];
	private _signals: ReputationSignals;
	private _lastEvaluatedAt: Date;
	private _lastHumanInteractionAt: Date | null;
	private _cooldownCount: number;
	private _cooldownReason: CooldownReason | null;
	private _cooldownStartedAt: Date | null;

	private constructor(
		public readonly instanceId: string,
		score: number,
		temperatureLevel: InstanceTemperatureLevel,
		trend: TemperatureTrend,
		alerts: ReputationAlert[],
		signals: ReputationSignals,
		lastEvaluatedAt: Date,
		lastHumanInteractionAt: Date | null,
		cooldownCount: number,
		cooldownReason: CooldownReason | null,
		cooldownStartedAt: Date | null,
	) {
		this._score = this.clampScore(score);
		this._temperatureLevel = temperatureLevel;
		this._trend = trend;
		this._alerts = [...alerts];
		this._signals = { ...signals };
		this._lastEvaluatedAt = lastEvaluatedAt;
		this._lastHumanInteractionAt = lastHumanInteractionAt;
		this._cooldownCount = cooldownCount;
		this._cooldownReason = cooldownReason;
		this._cooldownStartedAt = cooldownStartedAt;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// GETTERS (Read-only access to internal state)
	// ═══════════════════════════════════════════════════════════════════════════

	get score(): number {
		return this._score;
	}

	get temperatureLevel(): InstanceTemperatureLevel {
		return this._temperatureLevel;
	}

	get trend(): TemperatureTrend {
		return this._trend;
	}

	get alerts(): readonly ReputationAlert[] {
		return this._alerts;
	}

	get signals(): Readonly<ReputationSignals> {
		return this._signals;
	}

	get lastEvaluatedAt(): Date {
		return this._lastEvaluatedAt;
	}

	get lastHumanInteractionAt(): Date | null {
		return this._lastHumanInteractionAt;
	}

	get cooldownCount(): number {
		return this._cooldownCount;
	}

	get cooldownReason(): CooldownReason | null {
		return this._cooldownReason;
	}

	get cooldownStartedAt(): Date | null {
		return this._cooldownStartedAt;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// FACTORY METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Creates a new InstanceReputation for a fresh instance.
	 * Starts with default score, COLD temperature, and no alerts.
	 */
	static initialize(instanceId: string): InstanceReputation {
		return new InstanceReputation(
			instanceId,
			INITIAL_SCORE,
			"COLD",
			"STABLE",
			[],
			DEFAULT_SIGNALS,
			new Date(),
			null,
			0,
			null,
			null,
		);
	}

	/**
	 * Reconstitutes an InstanceReputation from persisted data.
	 * Used by repositories to hydrate the entity.
	 */
	static reconstitute(params: {
		instanceId: string;
		score: number;
		temperatureLevel: InstanceTemperatureLevel;
		trend: TemperatureTrend;
		alerts: ReputationAlert[];
		signals: ReputationSignals;
		lastEvaluatedAt: Date;
		lastHumanInteractionAt: Date | null;
		cooldownCount: number;
		cooldownReason: CooldownReason | null;
		cooldownStartedAt: Date | null;
	}): InstanceReputation {
		return new InstanceReputation(
			params.instanceId,
			params.score,
			params.temperatureLevel,
			params.trend,
			params.alerts,
			params.signals,
			params.lastEvaluatedAt,
			params.lastHumanInteractionAt,
			params.cooldownCount,
			params.cooldownReason,
			params.cooldownStartedAt,
		);
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// DOMAIN BEHAVIOR - State Mutations
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Applies a complete evaluation result atomically.
	 * This is the ONLY way to update the reputation state after evaluation.
	 *
	 * @param newScore - Calculated reputation score (0-100)
	 * @param newTemperature - Derived temperature level
	 * @param trend - Calculated trend based on score change
	 * @param alerts - Generated alerts from evaluation
	 * @param signals - Snapshot of signals used in evaluation
	 */
	applyEvaluation(
		newScore: number,
		newTemperature: InstanceTemperatureLevel,
		trend: TemperatureTrend,
		alerts: ReputationAlert[],
		signals: ReputationSignals,
	): void {
		this._score = this.clampScore(newScore);
		this._temperatureLevel = newTemperature;
		this._trend = trend;
		this._alerts = [...alerts];
		this._signals = { ...signals };
		this._lastEvaluatedAt = new Date();

		// Update human interaction timestamp if detected
		if (signals.humanInteractions > 0) {
			this._lastHumanInteractionAt = new Date();
		}

		// Auto-exit cooldown if score recovered and not recently entered
		if (this._temperatureLevel === "COOLDOWN" && this._score >= 50) {
			this.exitCooldown();
		}
	}

	/**
	 * Enters cooldown state with a semantic reason.
	 * Increments cooldown counter for risk tracking.
	 *
	 * @param reason - Why the instance is entering cooldown
	 */
	enterCooldown(reason: CooldownReason): void {
		this._temperatureLevel = "COOLDOWN";
		this._cooldownCount += 1;
		this._cooldownReason = reason;
		this._cooldownStartedAt = new Date();
	}

	/**
	 * Exits cooldown state. Called when instance recovers.
	 */
	exitCooldown(): void {
		if (this._temperatureLevel === "COOLDOWN") {
			this._temperatureLevel = "COLD"; // Reset to cold, needs warming
			this._cooldownReason = null;
			this._cooldownStartedAt = null;
		}
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// DOMAIN QUERIES - Business Rules
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Checks if the instance is in a healthy state for normal operations.
	 * Healthy = score >= 60 AND not overheated/cooldown
	 */
	isHealthy(): boolean {
		return (
			this._score >= 60 &&
			this._temperatureLevel !== "OVERHEATED" &&
			this._temperatureLevel !== "COOLDOWN"
		);
	}

	/**
	 * Checks if the instance is at risk and needs attention.
	 * At risk = low score OR has critical alerts OR in problematic state
	 */
	isAtRisk(): boolean {
		const hasCriticalAlert = this._alerts.some(
			(alert) => alert.severity === "CRITICAL" || alert.severity === "HIGH",
		);

		return (
			this._score < 40 ||
			hasCriticalAlert ||
			this._temperatureLevel === "OVERHEATED" ||
			this._temperatureLevel === "COOLDOWN"
		);
	}

	/**
	 * Checks if cooldown is required based on current state.
	 */
	requiresCooldown(): boolean {
		return (
			this._score < 30 ||
			this._temperatureLevel === "OVERHEATED" ||
			this._temperatureLevel === "COOLDOWN"
		);
	}

	/**
	 * Checks if the instance can dispatch messages.
	 * Considers cooldown state and minimum cooldown duration.
	 *
	 * @param now - Current time (injectable for testing)
	 */
	canDispatch(now: Date = new Date()): boolean {
		// Cannot dispatch during cooldown
		if (this._temperatureLevel === "COOLDOWN") {
			// Check if minimum cooldown duration has passed
			if (this._cooldownStartedAt) {
				const cooldownDuration =
					now.getTime() - this._cooldownStartedAt.getTime();
				if (cooldownDuration < MIN_COOLDOWN_DURATION_MS) {
					return false;
				}
			}
			return false;
		}

		// Cannot dispatch if overheated
		if (this._temperatureLevel === "OVERHEATED") {
			return false;
		}

		return true;
	}

	/**
	 * Gets the risk level for external reporting.
	 */
	getRiskLevel(): "low" | "medium" | "high" {
		if (
			this._temperatureLevel === "OVERHEATED" ||
			this._temperatureLevel === "COOLDOWN"
		) {
			return "high";
		}

		if (this._score < 40 || this._alerts.length > 0) {
			return "medium";
		}

		return "low";
	}

	/**
	 * Calculates days since last human interaction.
	 * Returns null if no human interaction recorded.
	 */
	daysSinceHumanInteraction(now: Date = new Date()): number | null {
		if (!this._lastHumanInteractionAt) {
			return null;
		}

		const diffMs = now.getTime() - this._lastHumanInteractionAt.getTime();
		return Math.floor(diffMs / (1000 * 60 * 60 * 24));
	}

	currentWarmUpPhase(now: Date = new Date()): WarmUpPhase {
		if (this._temperatureLevel === "COOLDOWN" || this._temperatureLevel === "OVERHEATED") {
			return "OBSERVER";
		}

		if (
			this._lastHumanInteractionAt === null &&
			this._cooldownCount === 0 &&
			this._signals.messagesSent === 0 &&
			this._signals.messagesReplied === 0 &&
			this._score <= INITIAL_SCORE
		) {
			return "NEWBORN";
		}

		if (!this.canDispatch(now)) {
			return "OBSERVER";
		}

		const hasHighOrCriticalAlert = this._alerts.some(
			(alert) => alert.severity === "CRITICAL" || alert.severity === "HIGH",
		);
		if (hasHighOrCriticalAlert) {
			return "OBSERVER";
		}

		if (this._cooldownCount >= 3) {
			return "NEWBORN";
		}

		if (this._score < 55) return "OBSERVER";
		if (this._score < 70) return "INTERACTING";
		if (this._score < 85) return "SOCIAL";
		return "READY";
	}

	evaluateWindow(signals: ReputationSignals): {
		scoreDelta: number;
		alerts: readonly ReputationAlert[];
		requiresCooldown: boolean;
		cooldownReason: CooldownReason | null;
	} {
		const alerts: ReputationAlert[] = [];
		let scoreDelta = 0;

		if (signals.messagesSent === 0) {
			return {
				scoreDelta: 0,
				alerts: [],
				requiresCooldown: false,
				cooldownReason: null,
			};
		}

		const observations =
			signals.messagesDelivered +
			signals.deliveryFailures +
			signals.messagesRead +
			signals.messagesReplied +
			signals.connectionDisconnects;
		if (observations < 5) {
			return {
				scoreDelta: 0,
				alerts: [],
				requiresCooldown: false,
				cooldownReason: null,
			};
		}

		const deliveredRate =
			signals.messagesDelivered / signals.messagesSent;
		const replyRate =
			signals.messagesReplied / signals.messagesSent;
		const readRate =
			signals.messagesDelivered === 0 ? 0 : signals.messagesRead / signals.messagesDelivered;

		const hasDeliveryEvidence = signals.messagesDelivered + signals.deliveryFailures > 0;
		if (hasDeliveryEvidence) {
			if (signals.messagesSent >= 20 && deliveredRate < 0.4) {
				alerts.push(createAlert.deliveryDrop(deliveredRate));
				scoreDelta -= 15;
			}
		}

		if (signals.messagesSent >= 10 && readRate < 0.1) {
			scoreDelta -= 5;
		}

		if (signals.messagesSent >= 10 && replyRate < 0.03) {
			scoreDelta -= 8;
		}

		if (hasDeliveryEvidence) {
			if (signals.averageDeliveryLatencyMs >= 15_000 && signals.messagesSent >= 5) {
				alerts.push(createAlert.sendDelaySpike(signals.averageDeliveryLatencyMs));
				scoreDelta -= 5;
			}
		}

		if (signals.connectionDisconnects >= 3) {
			scoreDelta -= 8;
		}

		let cooldownReason: CooldownReason | null = null;
		if (hasDeliveryEvidence && deliveredRate < 0.25 && signals.messagesSent >= 20) {
			cooldownReason = "DELIVERY_DROP";
		}
		if (
			cooldownReason === null &&
			hasDeliveryEvidence &&
			signals.averageDeliveryLatencyMs >= 30_000 &&
			signals.messagesSent >= 10
		) {
			cooldownReason = "SEND_DELAY_SPIKE";
		}
		if (
			cooldownReason === null &&
			signals.connectionDisconnects >= 5 &&
			signals.messagesSent >= 5
		) {
			cooldownReason = "CONNECTION_INSTABILITY";
		}

		const requiresCooldown = cooldownReason !== null;

		return { scoreDelta, alerts, requiresCooldown, cooldownReason };
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// PRIVATE HELPERS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Ensures score stays within valid bounds (0-100).
	 */
	private clampScore(score: number): number {
		return Math.max(0, Math.min(100, score));
	}
}

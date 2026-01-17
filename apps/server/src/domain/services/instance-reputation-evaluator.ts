import type {
	InstanceReputation,
	ReputationSignals,
} from "../entities/instance-reputation";
import type { InstanceTemperatureLevel } from "../value-objects/instance-temperature-level";
import type { ReputationAlert } from "../value-objects/reputation-alert";
import { createAlert } from "../value-objects/reputation-alert";
import type { TemperatureTrend } from "../value-objects/temperature-trend";
import { InstanceTemperatureMapper } from "./instance-temperature-mapper";

/**
 * Interface for reputation evaluators.
 * Allows swapping rule-based evaluator with ML evaluator in the future.
 */
export interface IInstanceReputationEvaluator {
	evaluate(
		reputation: InstanceReputation,
		signals: ReputationSignals,
	): InstanceReputation;
}

/**
 * Score adjustment constants.
 * Centralized for easy tuning and ML comparison.
 */
const SCORE_ADJUSTMENTS = {
	HIGH_REPLY_RATE_BONUS: 5,
	LOW_REPLY_RATE_PENALTY: 8,
	BLOCK_DETECTED_PENALTY: 25,
	DELIVERY_FAILURES_PENALTY: 10,
	HUMAN_INTERACTION_BONUS: 3,
	REACTION_BONUS: 2,
	GROUP_INTERACTION_BONUS: 2,
	MEDIA_DIVERSITY_BONUS: 1,
	RAPID_DROP_THRESHOLD: 15,
} as const;

/**
 * Threshold constants for evaluation rules.
 */
const THRESHOLDS = {
	HIGH_REPLY_RATE: 0.15,
	LOW_REPLY_RATE: 0.03,
	DELIVERY_FAILURE_LIMIT: 3,
	HEALTHY_SCORE: 50,
	DEGRADING_SCORE: 50,
	NO_HUMAN_INTERACTION_DAYS: 7,
} as const;

/**
 * Rule-based reputation evaluator.
 *
 * Evaluates instance reputation based on behavioral signals.
 * Produces a new score, temperature, trend, and alerts.
 *
 * DESIGN:
 * - Pure evaluation logic (no side effects)
 * - All state changes via entity's applyEvaluation()
 * - Alerts generated based on evaluation results
 * - ML-ready: can be replaced with ML adapter
 */
export class InstanceReputationEvaluator
	implements IInstanceReputationEvaluator
{
	/**
	 * Evaluates the reputation based on current state and new signals.
	 * Returns the same entity with updated state.
	 *
	 * @param reputation - Current reputation state
	 * @param signals - New signals snapshot to evaluate
	 * @returns The updated reputation entity
	 */
	evaluate(
		reputation: InstanceReputation,
		signals: ReputationSignals,
	): InstanceReputation {
		const previousScore = reputation.score;
		const window = reputation.evaluateWindow(signals);

		// Calculate new score based on signals
		const newScore = this.calculateScore(previousScore, signals) + window.scoreDelta;

		// Determine temperature from score
		const newTemperature = this.determineTemperature(newScore, signals);

		// Calculate trend based on score change
		const trend = this.calculateTrend(previousScore, newScore);

		// Generate alerts based on evaluation
		const alerts = [
			...this.generateAlerts(
				newScore,
				previousScore,
				newTemperature,
				signals,
				reputation,
			),
			...window.alerts,
		];

		// Apply all changes atomically to the entity
		reputation.applyEvaluation(
			newScore,
			newTemperature,
			trend,
			alerts,
			signals,
		);

		// Handle critical states that require cooldown
		if (window.cooldownReason) {
			reputation.enterCooldown(window.cooldownReason);
		} else if (signals.messagesBlocked > 0) {
			reputation.enterCooldown("BLOCK_SPIKE");
		} else if (reputation.requiresCooldown()) {
			reputation.enterCooldown("SCORE_THRESHOLD");
		}

		return reputation;
	}

	/**
	 * Calculates new reputation score based on signals.
	 */
	private calculateScore(
		currentScore: number,
		signals: ReputationSignals,
	): number {
		let score = currentScore;

		// Reply rate evaluation
		const replyRate = this.calculateReplyRate(signals);

		if (replyRate > THRESHOLDS.HIGH_REPLY_RATE) {
			score += SCORE_ADJUSTMENTS.HIGH_REPLY_RATE_BONUS;
		}

		if (replyRate < THRESHOLDS.LOW_REPLY_RATE && signals.messagesSent > 10) {
			score -= SCORE_ADJUSTMENTS.LOW_REPLY_RATE_PENALTY;
		}

		// Block detection (critical signal)
		if (signals.messagesBlocked > 0) {
			score -=
				SCORE_ADJUSTMENTS.BLOCK_DETECTED_PENALTY * signals.messagesBlocked;
		}

		// Delivery failures
		if (signals.deliveryFailures > THRESHOLDS.DELIVERY_FAILURE_LIMIT) {
			score -= SCORE_ADJUSTMENTS.DELIVERY_FAILURES_PENALTY;
		}

		// Human interaction bonus
		if (signals.humanInteractions > 0) {
			score += SCORE_ADJUSTMENTS.HUMAN_INTERACTION_BONUS;
		}

		// Reactions bonus (engagement signal)
		if (signals.reactionsReceived > 0) {
			score += Math.min(
				signals.reactionsReceived * SCORE_ADJUSTMENTS.REACTION_BONUS,
				10,
			);
		}

		// Group interaction bonus (social proof)
		if (signals.groupInteractions > 0) {
			score += SCORE_ADJUSTMENTS.GROUP_INTERACTION_BONUS;
		}

		// Media diversity bonus (human-like behavior)
		if (signals.mediaMessages > 0 && signals.textMessages > 0) {
			score += SCORE_ADJUSTMENTS.MEDIA_DIVERSITY_BONUS;
		}

		// Clamp to valid range
		return Math.max(0, Math.min(100, score));
	}

	/**
	 * Determines temperature level from score and signals.
	 */
	private determineTemperature(
		score: number,
		signals: ReputationSignals,
	): InstanceTemperatureLevel {
		// Blocks force overheated regardless of score
		if (signals.messagesBlocked > 0) {
			return "OVERHEATED";
		}

		return InstanceTemperatureMapper.fromScore(score);
	}

	/**
	 * Calculates trend based on score change.
	 */
	private calculateTrend(
		previousScore: number,
		newScore: number,
	): TemperatureTrend {
		const diff = newScore - previousScore;

		if (diff > 2) return "UP";
		if (diff < -2) return "DOWN";
		return "STABLE";
	}

	/**
	 * Generates alerts based on evaluation results.
	 */
	private generateAlerts(
		newScore: number,
		previousScore: number,
		temperature: InstanceTemperatureLevel,
		signals: ReputationSignals,
		reputation: InstanceReputation,
	): ReputationAlert[] {
		const alerts: ReputationAlert[] = [];

		// Critical: Blocks detected
		if (signals.messagesBlocked > 0) {
			alerts.push(createAlert.blockDetected(signals.messagesBlocked));
		}

		// High: Delivery failures
		if (signals.deliveryFailures > THRESHOLDS.DELIVERY_FAILURE_LIMIT) {
			alerts.push(createAlert.highDeliveryFailures(signals.deliveryFailures));
		}

		// Critical: Overheated state
		if (temperature === "OVERHEATED") {
			alerts.push(createAlert.overheated());
		}

		// Critical: Cooldown required
		if (newScore < 30) {
			alerts.push(createAlert.cooldownRequired());
		}

		// Medium: Score degrading
		if (newScore < THRESHOLDS.DEGRADING_SCORE && newScore >= 30) {
			alerts.push(createAlert.scoreDegrading(newScore));
		}

		// Medium: Low reply rate
		const replyRate = this.calculateReplyRate(signals);
		if (replyRate < THRESHOLDS.LOW_REPLY_RATE && signals.messagesSent > 10) {
			alerts.push(createAlert.lowReplyRate(replyRate));
		}

		// High: Rapid score drop
		const scoreDrop = previousScore - newScore;
		if (scoreDrop >= SCORE_ADJUSTMENTS.RAPID_DROP_THRESHOLD) {
			alerts.push(createAlert.rapidScoreDrop(scoreDrop));
		}

		// Low: No human interaction
		const daysSinceHuman = reputation.daysSinceHumanInteraction();
		if (
			daysSinceHuman !== null &&
			daysSinceHuman > THRESHOLDS.NO_HUMAN_INTERACTION_DAYS
		) {
			alerts.push(createAlert.noHumanInteraction(daysSinceHuman));
		}

		return alerts;
	}

	/**
	 * Calculates reply rate from signals.
	 */
	private calculateReplyRate(signals: ReputationSignals): number {
		if (signals.messagesSent === 0) return 0;
		return signals.messagesReplied / signals.messagesSent;
	}
}

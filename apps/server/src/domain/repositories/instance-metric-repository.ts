import type { ReputationSignals } from "../entities/instance-reputation";

/**
 * Repository interface for fetching instance metrics/signals.
 *
 * Implementations should aggregate metrics from:
 * - Message events (sent, delivered, read, replied)
 * - Block detection events
 * - Human interaction tracking
 * - Group activity logs
 *
 * The signals returned should be for a specific evaluation window
 * (e.g., last 24 hours or since last evaluation).
 */
export interface InstanceMetricRepository {
	/**
	 * Fetches aggregated signals for reputation evaluation.
	 *
	 * @param instanceId - The WhatsApp instance identifier
	 * @returns Aggregated signals snapshot for the evaluation window
	 */
	getRecentSignals(instanceId: string): Promise<ReputationSignals>;
}

// Re-export ReputationSignals for backward compatibility
export type { ReputationSignals } from "../entities/instance-reputation";

import type { InstanceTemperatureLevel } from "../value-objects/instance-temperature-level";

/**
 * Maps a reputation score to a temperature level.
 *
 * Score ranges:
 * - 80-100: HOT (fully warmed, maximum dispatch capacity)
 * - 60-79:  WARM (healthy state, good dispatch capacity)
 * - 40-59:  WARMING (building reputation, moderate capacity)
 * - 20-39:  COLD (new/recovering, limited capacity)
 * - 0-19:   OVERHEATED (critical state, needs cooldown)
 *
 * @param score - Reputation score (0-100)
 * @returns Corresponding temperature level
 */
export const mapScoreToTemperature = (
  score: number
): InstanceTemperatureLevel => {
  if (score >= 80) return "HOT";
  if (score >= 60) return "WARM";
  if (score >= 40) return "WARMING";
  if (score >= 20) return "COLD";
  return "OVERHEATED";
};

/**
 * @deprecated Use mapScoreToTemperature function directly.
 * Kept for backward compatibility.
 */
export const InstanceTemperatureMapper = {
  fromScore: mapScoreToTemperature,
};

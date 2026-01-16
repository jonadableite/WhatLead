import type { InstanceTemperatureLevel } from "../value-objects/instance-temperature-level";

/**
 * Heating limits configuration for dispatch operations.
 */
export interface HeatingLimits {
  /** Maximum messages allowed per hour */
  maxMessagesPerHour: number;
  /** Maximum messages allowed per day */
  maxMessagesPerDay: number;
  /** Minimum delay between messages in seconds */
  minDelayBetweenMessagesInSeconds: number;
}

/**
 * Gets dispatch limits based on instance temperature level.
 *
 * This policy ensures:
 * - Cold instances send slowly to build reputation
 * - Warmer instances can dispatch faster
 * - Overheated/Cooldown instances are restricted
 *
 * @param temperature - Current instance temperature level
 * @returns Dispatch limits for the temperature
 */
export const getHeatingLimits = (
  temperature: InstanceTemperatureLevel
): HeatingLimits => {
  switch (temperature) {
    case "COLD":
      return {
        maxMessagesPerHour: 5,
        maxMessagesPerDay: 20,
        minDelayBetweenMessagesInSeconds: 120,
      };

    case "WARMING":
      return {
        maxMessagesPerHour: 15,
        maxMessagesPerDay: 60,
        minDelayBetweenMessagesInSeconds: 60,
      };

    case "WARM":
      return {
        maxMessagesPerHour: 30,
        maxMessagesPerDay: 150,
        minDelayBetweenMessagesInSeconds: 40,
      };

    case "HOT":
      return {
        maxMessagesPerHour: 60,
        maxMessagesPerDay: 300,
        minDelayBetweenMessagesInSeconds: 25,
      };

    case "OVERHEATED":
      return {
        maxMessagesPerHour: 10,
        maxMessagesPerDay: 40,
        minDelayBetweenMessagesInSeconds: 120,
      };

    case "COOLDOWN":
      return {
        maxMessagesPerHour: 0,
        maxMessagesPerDay: 0,
        minDelayBetweenMessagesInSeconds: 0, // Dispatch paused
      };
  }
};

/**
 * @deprecated Use getHeatingLimits function directly.
 * Kept for backward compatibility with HeaterUseCase.
 */
export const InstanceHeatingPolicy = {
  getLimits: getHeatingLimits,
};

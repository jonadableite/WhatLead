export const TEMPERATURE_TRENDS = ["UP", "DOWN", "STABLE"] as const;

export type TemperatureTrend = (typeof TEMPERATURE_TRENDS)[number];

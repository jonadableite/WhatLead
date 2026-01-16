export const INSTANCE_TEMPERATURE_LEVELS = [
	"COLD",
	"WARMING",
	"WARM",
	"HOT",
	"OVERHEATED",
	"COOLDOWN",
] as const;

export type InstanceTemperatureLevel =
	(typeof INSTANCE_TEMPERATURE_LEVELS)[number];

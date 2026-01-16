export const INSTANCE_HEALTH_ACTIONS = [
	"ENTER_COOLDOWN",
	"ALLOW_DISPATCH",
	"BLOCK_DISPATCH",
	"ALERT",
] as const;

export type InstanceHealthAction = (typeof INSTANCE_HEALTH_ACTIONS)[number];

export const isValidInstanceHealthAction = (
	value: string,
): value is InstanceHealthAction =>
	INSTANCE_HEALTH_ACTIONS.includes(value as InstanceHealthAction);


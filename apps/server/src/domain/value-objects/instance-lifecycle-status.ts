export const INSTANCE_LIFECYCLE_STATUSES = [
	"CREATED",
	"ACTIVE",
	"COOLDOWN",
	"BANNED",
] as const;

export type InstanceLifecycleStatus =
	(typeof INSTANCE_LIFECYCLE_STATUSES)[number];

export const isValidInstanceLifecycleStatus = (
	value: string,
): value is InstanceLifecycleStatus =>
	INSTANCE_LIFECYCLE_STATUSES.includes(value as InstanceLifecycleStatus);


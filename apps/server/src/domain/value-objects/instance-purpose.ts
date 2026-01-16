export const INSTANCE_PURPOSES = ["WARMUP", "DISPATCH", "MIXED"] as const;

export type InstancePurpose = (typeof INSTANCE_PURPOSES)[number];

export const isValidInstancePurpose = (value: string): value is InstancePurpose =>
	INSTANCE_PURPOSES.includes(value as InstancePurpose);


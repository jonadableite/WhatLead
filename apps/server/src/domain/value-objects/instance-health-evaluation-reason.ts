export const INSTANCE_HEALTH_EVALUATION_REASONS = [
	"WEBHOOK",
	"CRON",
	"PRE_DISPATCH",
	"POST_CAMPAIGN",
] as const;

export type InstanceHealthEvaluationReason =
	(typeof INSTANCE_HEALTH_EVALUATION_REASONS)[number];

export const isValidInstanceHealthEvaluationReason = (
	value: string,
): value is InstanceHealthEvaluationReason =>
	INSTANCE_HEALTH_EVALUATION_REASONS.includes(
		value as InstanceHealthEvaluationReason,
	);


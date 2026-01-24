export const EXECUTION_CONTROL_SCOPES = [
	"INSTANCE",
	"ORGANIZATION",
	"CAMPAIGN",
] as const;

export type ExecutionControlScope = (typeof EXECUTION_CONTROL_SCOPES)[number];


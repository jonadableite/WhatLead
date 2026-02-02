export const EXECUTION_JOB_STATUSES = [
	"PENDING",
	"RUNNING",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
] as const;

export type ExecutionJobStatus = (typeof EXECUTION_JOB_STATUSES)[number];

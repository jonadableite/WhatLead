export const MESSAGE_EXECUTION_STATUSES = [
	"PENDING",
	"PROCESSING",
	"SENT",
	"FAILED",
	"RETRY",
] as const;

export type MessageExecutionStatus = (typeof MESSAGE_EXECUTION_STATUSES)[number];


export const EXECUTION_CONTROL_STATUSES = ["ACTIVE", "PAUSED"] as const;

export type ExecutionControlStatus = (typeof EXECUTION_CONTROL_STATUSES)[number];


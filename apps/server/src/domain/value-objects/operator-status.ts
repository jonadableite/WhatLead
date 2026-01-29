export const OPERATOR_STATUSES = ["ONLINE", "AWAY", "OFFLINE"] as const;

export type OperatorStatus = (typeof OPERATOR_STATUSES)[number];

export const SLA_STATUSES = ["OK", "DUE_SOON", "BREACHED"] as const;
export type SLAStatus = (typeof SLA_STATUSES)[number];


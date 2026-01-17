export const AGENT_STATUSES = ["ONLINE", "OFFLINE"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];


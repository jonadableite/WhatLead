export const AGENT_ROLES = ["SDR", "CLOSER", "BOT"] as const;
export type AgentRole = (typeof AGENT_ROLES)[number];


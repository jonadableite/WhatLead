export const AGENT_PURPOSES = ["SDR", "FOLLOW_UP", "QUALIFICATION", "WARMUP"] as const;
export type AgentPurpose = (typeof AGENT_PURPOSES)[number];


export const AGENT_TONES = ["FORMAL", "NEUTRAL", "CASUAL"] as const;
export type AgentTone = (typeof AGENT_TONES)[number];


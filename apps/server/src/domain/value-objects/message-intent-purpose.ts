export const MESSAGE_INTENT_PURPOSES = ["WARMUP", "DISPATCH", "SCHEDULE"] as const;

export type MessageIntentPurpose = (typeof MESSAGE_INTENT_PURPOSES)[number];


export const MESSAGE_INTENT_TYPES = ["TEXT", "AUDIO", "MEDIA", "REACTION"] as const;

export type MessageIntentType = (typeof MESSAGE_INTENT_TYPES)[number];


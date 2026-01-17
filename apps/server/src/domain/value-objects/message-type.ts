export const MESSAGE_TYPES = ["TEXT", "AUDIO", "IMAGE", "STICKER", "REACTION"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];


export const CONVERSATION_CHANNELS = ["WHATSAPP"] as const;
export type ConversationChannel = (typeof CONVERSATION_CHANNELS)[number];


export const CONVERSATION_STATUSES = ["OPEN", "WAITING", "CLOSED", "LOST"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

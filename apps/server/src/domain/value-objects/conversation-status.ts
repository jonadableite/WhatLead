export const CONVERSATION_STATUSES = ["OPEN", "ASSIGNED", "CLOSED"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];


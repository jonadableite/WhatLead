export const CONVERSATION_KINDS = ["PRIVATE", "GROUP"] as const;
export type ConversationKind = (typeof CONVERSATION_KINDS)[number];


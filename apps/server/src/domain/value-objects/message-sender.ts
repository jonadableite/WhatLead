export const MESSAGE_SENDERS = ["INSTANCE", "AGENT", "CONTACT", "BOT"] as const;
export type MessageSender = (typeof MESSAGE_SENDERS)[number];

export const MESSAGE_SENDERS = ["INSTANCE", "AGENT", "BOT"] as const;
export type MessageSender = (typeof MESSAGE_SENDERS)[number];


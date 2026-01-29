export const MESSAGE_DELIVERY_STATUSES = ["PENDING", "SENT", "FAILED"] as const;

export type MessageDeliveryStatus = (typeof MESSAGE_DELIVERY_STATUSES)[number];

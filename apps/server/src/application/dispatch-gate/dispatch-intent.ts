import type { DispatchPayload } from "../dispatch/dispatch-types";

export const DISPATCH_INTENT_TYPES = ["REPLY", "FOLLOW_UP", "CAMPAIGN", "WARMUP"] as const;
export type DispatchIntentType = (typeof DISPATCH_INTENT_TYPES)[number];

export const DISPATCH_INTENT_REASONS = ["OPERATOR", "SLA", "CAMPAIGN", "SYSTEM", "AGENT"] as const;
export type DispatchIntentReason = (typeof DISPATCH_INTENT_REASONS)[number];

export interface DispatchIntent {
	instanceId: string;
	conversationId?: string;
	type: DispatchIntentType;
	payload: DispatchPayload;
	reason: DispatchIntentReason;
	now?: Date;
}


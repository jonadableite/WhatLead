import type { ReplyIntent } from "./reply-intent";

export interface RoutingDecision {
	assignAgentId?: string;
	assignOperatorId?: string;
	markWaiting?: boolean;
	replyIntent: ReplyIntent;
}

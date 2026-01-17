import type { ReplyIntent } from "./reply-intent";

export interface RoutingDecision {
	assignAgentId?: string;
	markWaiting?: boolean;
	replyIntent: ReplyIntent;
}

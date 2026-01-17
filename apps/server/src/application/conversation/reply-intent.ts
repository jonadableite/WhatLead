export type ReplyIntentType = "TEXT" | "REACTION" | "NONE";
export type ReplyIntentReason = "AUTO_REPLY" | "BOT" | "FOLLOW_UP";

export type ReplyIntent =
	| {
			conversationId: string;
			instanceId: string;
			type: "NONE";
			reason: ReplyIntentReason;
	  }
	| {
			conversationId: string;
			instanceId: string;
			type: "TEXT";
			reason: ReplyIntentReason;
			payload: { to: string; text: string };
	  }
	| {
			conversationId: string;
			instanceId: string;
			type: "REACTION";
			reason: ReplyIntentReason;
			payload: { to: string; messageId: string; emoji: string };
	  };

export const noneReplyIntent = (params: {
	conversationId: string;
	instanceId: string;
	reason: ReplyIntentReason;
}): ReplyIntent => ({
	conversationId: params.conversationId,
	instanceId: params.instanceId,
	type: "NONE",
	reason: params.reason,
});

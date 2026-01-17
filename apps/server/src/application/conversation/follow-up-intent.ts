export type FollowUpIntentReason = "SLA_BREACH" | "NO_RESPONSE";
export type FollowUpIntentType = "TEXT" | "NONE";

export type FollowUpIntent =
	| {
			conversationId: string;
			instanceId: string;
			type: "NONE";
			reason: FollowUpIntentReason;
	  }
	| {
			conversationId: string;
			instanceId: string;
			type: "TEXT";
			reason: FollowUpIntentReason;
			payload: { to: string; text: string };
	  };


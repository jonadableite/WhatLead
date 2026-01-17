export type WarmupOperationalPhase = "BOOT" | "SOFT" | "NORMAL";

export type WarmupActionKind =
	| "SEND_TEXT"
	| "SEND_REACTION"
	| "SET_PRESENCE"
	| "MARK_AS_READ";

export interface ContentMix {
	text: number;
	reaction: number;
	media: number;
	sticker: number;
}

export interface WarmupPlan {
	instanceId: string;
	phase: WarmupOperationalPhase;
	allowedActions: readonly WarmupActionKind[];
	maxMessagesPerHour: number;
	maxGroups: number;
	maxActionsPerRun: number;
	contentMix: ContentMix;
}


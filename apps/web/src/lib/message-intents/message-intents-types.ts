export type MessageIntentStatus =
	| "PENDING"
	| "APPROVED"
	| "QUEUED"
	| "BLOCKED"
	| "DROPPED"
	| "SENT";

export type MessageIntentPurpose = "WARMUP" | "DISPATCH" | "SCHEDULE";
export type MessageIntentType = "TEXT" | "AUDIO" | "MEDIA" | "REACTION";

export type MessageTargetKind = "PHONE" | "GROUP";

export interface MessageTarget {
	kind: MessageTargetKind;
	value: string;
}

export interface MessageIntentListItem {
	id: string;
	target: MessageTarget;
	purpose: MessageIntentPurpose;
	status: MessageIntentStatus;
	decidedByInstanceId: string | null;
	createdAt: string;
}

export interface ListMessageIntentsResponse {
	items: MessageIntentListItem[];
}

export interface MessageIntentPayloadSummary {
	type: MessageIntentType;
	textPreview?: string;
	mediaUrl?: string;
	mimeType?: string;
	caption?: string;
	audioUrl?: string;
	emoji?: string;
	messageRef?: string;
}

export interface MessageIntentDetail {
	id: string;
	organizationId: string;
	status: MessageIntentStatus;
	purpose: MessageIntentPurpose;
	type: MessageIntentType;
	target: MessageTarget;
	decidedByInstanceId: string | null;
	blockedReason: string | null;
	queuedUntil: string | null;
	createdAt: string;
	payloadSummary: MessageIntentPayloadSummary;
}

export interface GetMessageIntentResponse {
	intent: MessageIntentDetail;
}

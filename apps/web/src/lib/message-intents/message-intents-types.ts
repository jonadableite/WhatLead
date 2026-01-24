export type MessageIntentStatus =
	| "PENDING"
	| "APPROVED"
	| "QUEUED"
	| "BLOCKED"
	| "DROPPED"
	| "SENT";

export type MessageIntentPurpose = "WARMUP" | "DISPATCH" | "SCHEDULE";

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

export type ConversationTimelineEvent =
	| MessageEvent
	| SystemEvent
	| AssignmentEvent
	| TagEvent;

export type ConversationTimelineEventType =
	| "MESSAGE"
	| "SYSTEM"
	| "ASSIGNMENT"
	| "TAG";

export type MessageOrigin = "MANUAL" | "AI" | "AUTOMATION";

export interface MessageEvent {
	type: "MESSAGE";
	messageId: string;
	direction: "INBOUND" | "OUTBOUND";
	origin: MessageOrigin;
	payload: {
		kind: "TEXT" | "MEDIA" | "AUDIO" | "REACTION";
		text?: string;
		media?: {
			url?: string;
			base64?: string;
			mimeType?: string;
			caption?: string;
		};
		audio?: {
			url?: string;
			base64?: string;
			mimeType?: string;
		};
		reaction?: {
			emoji: string;
			targetMessageId?: string;
		};
	};
	createdAt: Date;
}

export interface SystemEvent {
	type: "SYSTEM";
	action: "CONVERSATION_OPENED" | "CONVERSATION_CLOSED";
	createdAt: Date;
}

export interface AssignmentEvent {
	type: "ASSIGNMENT";
	assignedTo: { type: "OPERATOR" | "AI"; id: string };
	createdAt: Date;
}

export interface TagEvent {
	type: "TAG";
	tag: string;
	createdAt: Date;
}


import type { MessageIntentType } from "./message-intent-type";

export type MessageIntentPayload =
	| { type: "TEXT"; text: string }
	| { type: "AUDIO"; audioUrl: string }
	| { type: "MEDIA"; mediaUrl: string; mimeType: string; caption?: string }
	| { type: "REACTION"; emoji: string; messageRef?: string };

export const payloadTypeOf = (payload: MessageIntentPayload): MessageIntentType =>
	payload.type;


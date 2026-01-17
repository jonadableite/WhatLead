import type { DispatchIntentSource } from "../../domain/value-objects/dispatch-intent-source";
import type { MessageType } from "../../domain/value-objects/message-type";

export interface DispatchIntent {
	source: DispatchIntentSource;
	reason?: string;
}

export type DispatchPayload =
	| { type: "TEXT"; to: string; text: string }
	| { type: "REACTION"; to: string; messageId: string; emoji: string }
	| { type: "AUDIO"; to: string; mediaUrl?: string; base64?: string; ptt?: boolean }
	| {
			type: "IMAGE";
			to: string;
			mediaUrl?: string;
			base64?: string;
			mimeType?: string;
			caption?: string;
	  }
	| { type: "STICKER"; to: string; mediaUrl?: string; base64?: string };

export interface DispatchRequest {
	instanceId: string;
	intent: DispatchIntent;
	message: DispatchPayload;
	now?: Date;
}

export interface DispatchPortResult {
	success: boolean;
	error?: string;
	errorCode?: string;
	messageId?: string;
	occurredAt: Date;
	producedEvents?: import("../event-handlers/webhook-event-handler").NormalizedWhatsAppEvent[];
}

export interface MessageDispatchPort {
	send(params: {
		instanceId: string;
		message: DispatchPayload;
		now: Date;
	}): Promise<DispatchPortResult>;
}

export interface DispatchExecutionResult {
	decision: import("../../domain/value-objects/dispatch-decision").DispatchDecision;
	result:
		| { status: "SENT"; messageId?: string; occurredAt: Date }
		| { status: "BLOCKED"; reason: string }
		| { status: "FAILED"; error: string };
}

export const messageTypeOf = (p: DispatchPayload): MessageType => p.type;


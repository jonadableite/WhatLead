import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";

export type DispatchAction =
	| {
			type: "SEND_TEXT";
			instanceId: string;
			to: string;
			text: string;
			delayMs?: number;
	  }
	| {
			type: "SEND_REACTION";
			instanceId: string;
			to: string;
			messageId: string;
			emoji: string;
			delayMs?: number;
	  }
	| {
			type: "SET_PRESENCE";
			instanceId: string;
			to: string;
			presence: "available" | "unavailable" | "composing" | "recording";
			delayMs?: number;
	  }
	| {
			type: "MARK_AS_READ";
			instanceId: string;
			messageId: string;
			delayMs?: number;
	  };

export interface DispatchResult {
	success: boolean;
	error?: string;
	producedEvents?: readonly NormalizedWhatsAppEvent[];
}

export interface DispatchPort {
	send(action: DispatchAction): Promise<DispatchResult>;
}


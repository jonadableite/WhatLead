import type { DispatchBlockReason } from "./dispatch-block-reason";
import type { MessageType } from "./message-type";

export type DispatchDecision =
	| {
			allowed: true;
			maxMessages: number;
			minIntervalSeconds: number;
			allowedMessageTypes: readonly MessageType[];
	  }
	| {
			allowed: false;
			reason: DispatchBlockReason;
			maxMessages: 0;
			minIntervalSeconds: number;
			allowedMessageTypes: readonly MessageType[];
	  };

export const allowDispatch = (params: {
	maxMessages: number;
	minIntervalSeconds: number;
	allowedMessageTypes: readonly MessageType[];
}): DispatchDecision => ({
	allowed: true,
	maxMessages: params.maxMessages,
	minIntervalSeconds: params.minIntervalSeconds,
	allowedMessageTypes: params.allowedMessageTypes,
});

export const blockDispatch = (params: {
	reason: DispatchBlockReason;
	minIntervalSeconds?: number;
	allowedMessageTypes?: readonly MessageType[];
}): DispatchDecision => ({
	allowed: false,
	reason: params.reason,
	maxMessages: 0,
	minIntervalSeconds: params.minIntervalSeconds ?? 0,
	allowedMessageTypes: params.allowedMessageTypes ?? [],
});


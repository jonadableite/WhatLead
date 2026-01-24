import type { MessageIntent } from "../../domain/entities/message-intent";
import type { MessageIntentPurpose } from "../../domain/value-objects/message-intent-purpose";
import type { MessageIntentStatus } from "../../domain/value-objects/message-intent-status";
import type { MessageTarget } from "../../domain/value-objects/message-target";

export interface MessageIntentListItemViewModel {
	id: string;
	target: MessageTarget;
	purpose: MessageIntentPurpose;
	status: MessageIntentStatus;
	decidedByInstanceId: string | null;
	createdAt: Date;
}

export const toMessageIntentListItemViewModel = (
	intent: MessageIntent,
): MessageIntentListItemViewModel => ({
	id: intent.id,
	target: intent.target,
	purpose: intent.purpose,
	status: intent.status,
	decidedByInstanceId: intent.decidedByInstanceId,
	createdAt: intent.createdAt,
});

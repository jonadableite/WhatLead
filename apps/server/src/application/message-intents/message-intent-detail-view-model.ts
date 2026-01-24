import type { MessageIntent } from "../../domain/entities/message-intent";
import type { MessageGateDecisionReason } from "../../domain/value-objects/message-gate-decision-reason";
import type { MessageIntentPurpose } from "../../domain/value-objects/message-intent-purpose";
import type { MessageIntentStatus } from "../../domain/value-objects/message-intent-status";
import type { MessageIntentType } from "../../domain/value-objects/message-intent-type";
import type { MessageTarget } from "../../domain/value-objects/message-target";

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

export interface MessageIntentDetailViewModel {
	id: string;
	organizationId: string;
	status: MessageIntentStatus;
	purpose: MessageIntentPurpose;
	type: MessageIntentType;
	target: MessageTarget;
	decidedByInstanceId: string | null;
	blockedReason: MessageGateDecisionReason | null;
	queuedUntil: Date | null;
	createdAt: Date;
	payloadSummary: MessageIntentPayloadSummary;
}

export const toMessageIntentDetailViewModel = (
	intent: MessageIntent,
): MessageIntentDetailViewModel => ({
	id: intent.id,
	organizationId: intent.organizationId,
	status: intent.status,
	purpose: intent.purpose,
	type: intent.type,
	target: intent.target,
	decidedByInstanceId: intent.decidedByInstanceId,
	blockedReason: intent.blockedReason,
	queuedUntil: intent.queuedUntil,
	createdAt: intent.createdAt,
	payloadSummary: buildPayloadSummary(intent),
});

const buildPayloadSummary = (intent: MessageIntent): MessageIntentPayloadSummary => {
	const payload = intent.payload;

	if (payload.type === "TEXT") {
		return {
			type: payload.type,
			textPreview: payload.text.slice(0, 120),
		};
	}

	if (payload.type === "MEDIA") {
		return {
			type: payload.type,
			mediaUrl: payload.mediaUrl,
			mimeType: payload.mimeType,
			caption: payload.caption,
		};
	}

	if (payload.type === "AUDIO") {
		return {
			type: payload.type,
			audioUrl: payload.audioUrl,
		};
	}

	return {
		type: payload.type,
		emoji: payload.emoji,
		messageRef: payload.messageRef,
	};
};

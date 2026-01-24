import type { ExecutionWhatsAppProvider, SendMessageCommand } from "../../../application/execution/ports/whatsapp.provider";
import type {
	WhatsAppAudioCapable,
	WhatsAppProvider,
	WhatsAppReactionCapable,
} from "../../../application/providers/whatsapp-provider";
import {
	isAudioCapable,
	isReactionCapable,
} from "../../../application/providers/whatsapp-provider";

export class WhatsMeowAdapter implements ExecutionWhatsAppProvider {
	constructor(private readonly provider: WhatsAppProvider) {}

	async send(command: SendMessageCommand): Promise<void> {
		const target = command.target.value;
		const payload = command.payload;

		if (payload.type === "TEXT") {
			await this.provider.sendText({
				instanceId: command.instanceId,
				to: target,
				text: payload.text,
			});
			return;
		}

		if (payload.type === "MEDIA") {
			await this.provider.sendMedia({
				instanceId: command.instanceId,
				to: target,
				mediaUrl: payload.mediaUrl,
				mimeType: payload.mimeType,
				caption: payload.caption,
			});
			return;
		}

		if (payload.type === "AUDIO") {
			if (!isAudioCapable(this.provider)) {
				throw new Error("PROVIDER_AUDIO_NOT_SUPPORTED");
			}
			const audioProvider = this.provider as WhatsAppAudioCapable;
			await audioProvider.sendAudio({
				instanceId: command.instanceId,
				to: target,
				mediaUrl: payload.audioUrl,
				ptt: true,
			});
			return;
		}

		if (payload.type === "REACTION") {
			if (!isReactionCapable(this.provider)) {
				throw new Error("PROVIDER_REACTION_NOT_SUPPORTED");
			}
			if (!payload.messageRef) {
				throw new Error("REACTION_MISSING_MESSAGE_REF");
			}
			const reactionProvider = this.provider as WhatsAppReactionCapable;
			await reactionProvider.sendReaction({
				instanceId: command.instanceId,
				to: target,
				messageId: payload.messageRef,
				emoji: payload.emoji,
			});
			return;
		}
	}
}

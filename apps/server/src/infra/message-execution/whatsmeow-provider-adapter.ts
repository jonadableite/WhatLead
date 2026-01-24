import type { WhatsAppProviderPort } from "../../application/message-execution/whatsapp-provider-port";
import type { WhatsAppProvider } from "../../application/providers/whatsapp-provider";
import { isAudioCapable, isReactionCapable } from "../../application/providers/whatsapp-provider";

export class WhatsMeowProviderAdapter implements WhatsAppProviderPort {
	constructor(private readonly provider: WhatsAppProvider) {}

	async sendText(params: { instanceId: string; to: string; text: string }): Promise<void> {
		await this.provider.sendText({
			instanceId: params.instanceId,
			to: params.to,
			text: params.text,
		});
	}

	async sendMedia(params: {
		instanceId: string;
		to: string;
		url: string;
		mimeType: string;
		caption?: string;
	}): Promise<void> {
		await this.provider.sendMedia({
			instanceId: params.instanceId,
			to: params.to,
			mediaUrl: params.url,
			mimeType: params.mimeType,
			caption: params.caption,
		});
	}

	async sendAudio(params: { instanceId: string; to: string; url: string }): Promise<void> {
		if (!isAudioCapable(this.provider)) throw new Error("PROVIDER_NOT_AUDIO_CAPABLE");
		await this.provider.sendAudio({
			instanceId: params.instanceId,
			to: params.to,
			mediaUrl: params.url,
			ptt: true,
		});
	}

	async sendReaction(params: {
		instanceId: string;
		to: string;
		messageRef: string;
		emoji: string;
	}): Promise<void> {
		if (!isReactionCapable(this.provider)) throw new Error("PROVIDER_NOT_REACTION_CAPABLE");
		await this.provider.sendReaction({
			instanceId: params.instanceId,
			to: params.to,
			messageId: params.messageRef,
			emoji: params.emoji,
		});
	}
}


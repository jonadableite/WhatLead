import type { WhatsAppProviderPort } from "../../application/message-execution/whatsapp-provider-port";
import type { WhatsAppProvider } from "../../application/providers/whatsapp-provider";
import { isAudioCapable, isReactionCapable } from "../../application/providers/whatsapp-provider";
import { getProviderInstanceName } from "../../application/instances/provider-instance-name";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";

export class WhatsMeowProviderAdapter implements WhatsAppProviderPort {
	constructor(
		private readonly provider: WhatsAppProvider,
		private readonly instances: InstanceRepository,
	) {}

	async sendText(params: { instanceId: string; to: string; text: string }): Promise<void> {
		const instanceId = await resolveProviderInstanceId(this.instances, params.instanceId);
		await this.provider.sendText({
			instanceId,
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
		const instanceId = await resolveProviderInstanceId(this.instances, params.instanceId);
		await this.provider.sendMedia({
			instanceId,
			to: params.to,
			mediaUrl: params.url,
			mimeType: params.mimeType,
			caption: params.caption,
		});
	}

	async sendAudio(params: { instanceId: string; to: string; url: string }): Promise<void> {
		if (!isAudioCapable(this.provider)) throw new Error("PROVIDER_NOT_AUDIO_CAPABLE");
		const instanceId = await resolveProviderInstanceId(this.instances, params.instanceId);
		await this.provider.sendAudio({
			instanceId,
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
		const instanceId = await resolveProviderInstanceId(this.instances, params.instanceId);
		await this.provider.sendReaction({
			instanceId,
			to: params.to,
			messageId: params.messageRef,
			emoji: params.emoji,
		});
	}
}

const resolveProviderInstanceId = async (
	instances: InstanceRepository,
	instanceId: string,
): Promise<string> => {
	const instance = await instances.findById(instanceId);
	return instance ? getProviderInstanceName(instance) : instanceId;
};


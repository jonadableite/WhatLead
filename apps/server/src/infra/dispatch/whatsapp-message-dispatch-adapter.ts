import type { NormalizedWhatsAppEvent } from "../../application/event-handlers/webhook-event-handler";
import type {
	DispatchPayload,
	MessageDispatchPort,
	DispatchPortResult,
} from "../../application/dispatch/dispatch-types";
import { getProviderInstanceName } from "../../application/instances/provider-instance-name";
import {
	isAudioCapable,
	isReactionCapable,
	type WhatsAppProvider,
} from "../../application/providers/whatsapp-provider";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";

export class WhatsAppMessageDispatchAdapter implements MessageDispatchPort {
	constructor(
		private readonly provider: WhatsAppProvider,
		private readonly instances: InstanceRepository,
	) {}

	async send(params: {
		instanceId: string;
		message: DispatchPayload;
		now: Date;
	}): Promise<DispatchPortResult> {
		const occurredAt = params.now;
		const providerInstanceId = await resolveProviderInstanceId(
			this.instances,
			params.instanceId,
		);

		switch (params.message.type) {
			case "TEXT": {
				const result = await this.provider.sendText({
					instanceId: providerInstanceId,
					to: params.message.to,
					text: params.message.text,
				});

				return mapMessageResult({
					instanceId: params.instanceId,
					to: params.message.to,
					occurredAt,
					messageType: "text",
					metadata: { text: params.message.text },
					result,
				});
			}
			case "REACTION": {
				if (!isReactionCapable(this.provider)) {
					return mapMessageResult({
						instanceId: params.instanceId,
						to: params.message.to,
						occurredAt,
						messageType: "reaction",
						result: { success: false, error: "Provider does not support reactions" },
					});
				}

				const result = await this.provider.sendReaction({
					instanceId: providerInstanceId,
					to: params.message.to,
					messageId: params.message.messageId,
					emoji: params.message.emoji,
				});

				const producedEvents: NormalizedWhatsAppEvent[] = [
					{
						type: result.success ? "REACTION_SENT" : "MESSAGE_FAILED",
						source: "DISPATCH",
						instanceId: params.instanceId,
						occurredAt,
						isGroup: false,
						remoteJid: params.message.to,
						messageId: result.messageId,
						metadata: {
							messageType: "reaction",
							emoji: params.message.emoji,
							error: result.error,
							errorCode: result.errorCode,
						},
					},
				];

				if (!result.success && result.errorCode === "HTTP_429") {
					producedEvents.push({
						type: "RATE_LIMIT_HIT",
						source: "DISPATCH",
						instanceId: params.instanceId,
						occurredAt,
						isGroup: false,
						remoteJid: params.message.to,
						messageId: result.messageId,
						metadata: { errorCode: result.errorCode },
					});
				}

				return {
					success: result.success,
					error: result.error,
					errorCode: result.errorCode,
					messageId: result.messageId,
					occurredAt,
					producedEvents,
				};
			}
			case "AUDIO": {
				if (!isAudioCapable(this.provider)) {
					return mapMessageResult({
						instanceId: params.instanceId,
						to: params.message.to,
						occurredAt,
						messageType: "audio",
						result: { success: false, error: "Provider does not support audio" },
					});
				}

				const result = await this.provider.sendAudio({
					instanceId: providerInstanceId,
					to: params.message.to,
					mediaUrl: params.message.mediaUrl,
					base64: params.message.base64,
					ptt: params.message.ptt,
				});

				return mapMessageResult({
					instanceId: params.instanceId,
					to: params.message.to,
					occurredAt,
					messageType: "audio",
					metadata: { ptt: params.message.ptt },
					result,
				});
			}
			case "IMAGE": {
				const result = await this.provider.sendMedia({
					instanceId: providerInstanceId,
					to: params.message.to,
					mediaUrl: params.message.mediaUrl,
					base64: params.message.base64,
					mimeType: params.message.mimeType,
					caption: params.message.caption,
				});

				return mapMessageResult({
					instanceId: params.instanceId,
					to: params.message.to,
					occurredAt,
					messageType: "image",
					metadata: { caption: params.message.caption },
					result,
				});
			}
			case "STICKER": {
				const result = await this.provider.sendMedia({
					instanceId: providerInstanceId,
					to: params.message.to,
					mediaUrl: params.message.mediaUrl,
					base64: params.message.base64,
					mimeType: "image/webp",
				});

				return mapMessageResult({
					instanceId: params.instanceId,
					to: params.message.to,
					occurredAt,
					messageType: "sticker",
					result,
				});
			}
		}
	}
}

const resolveProviderInstanceId = async (
	instances: InstanceRepository,
	instanceId: string,
): Promise<string> => {
	const instance = await instances.findById(instanceId);
	return instance ? getProviderInstanceName(instance) : instanceId;
};

const mapMessageResult = (params: {
	instanceId: string;
	to: string;
	occurredAt: Date;
	messageType: string;
	metadata?: Record<string, unknown>;
	result: { success: boolean; error?: string; errorCode?: string; messageId?: string };
}): DispatchPortResult => {
	const producedEvents: NormalizedWhatsAppEvent[] = [
		{
			type: params.result.success ? "MESSAGE_SENT" : "MESSAGE_FAILED",
			source: "DISPATCH",
			instanceId: params.instanceId,
			occurredAt: params.occurredAt,
			isGroup: false,
			remoteJid: params.to,
			messageId: params.result.messageId,
			metadata: {
				messageType: params.messageType,
				...(params.metadata ?? {}),
				error: params.result.error,
				errorCode: params.result.errorCode,
			},
		},
	];

	if (!params.result.success && params.result.errorCode === "HTTP_429") {
		producedEvents.push({
			type: "RATE_LIMIT_HIT",
			source: "DISPATCH",
			instanceId: params.instanceId,
			occurredAt: params.occurredAt,
			isGroup: false,
			remoteJid: params.to,
			messageId: params.result.messageId,
			metadata: { errorCode: params.result.errorCode },
		});
	}

	return {
		success: params.result.success,
		error: params.result.error,
		errorCode: params.result.errorCode,
		messageId: params.result.messageId,
		occurredAt: params.occurredAt,
		producedEvents,
	};
};

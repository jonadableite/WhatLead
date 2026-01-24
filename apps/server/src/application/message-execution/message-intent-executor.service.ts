import type { MessageIntent } from "../../domain/entities/message-intent";
import type { WhatsAppProviderPort } from "./whatsapp-provider-port";

export class MessageIntentExecutorService {
	constructor(private readonly provider: WhatsAppProviderPort) {}

	async execute(params: { intent: MessageIntent; instanceId: string }): Promise<void> {
		const { intent, instanceId } = params;

		switch (intent.payload.type) {
			case "TEXT":
				await this.provider.sendText({
					instanceId,
					to: intent.target.value,
					text: intent.payload.text,
				});
				return;
			case "MEDIA":
				await this.provider.sendMedia({
					instanceId,
					to: intent.target.value,
					url: intent.payload.mediaUrl,
					mimeType: intent.payload.mimeType,
					caption: intent.payload.caption,
				});
				return;
			case "AUDIO":
				await this.provider.sendAudio({
					instanceId,
					to: intent.target.value,
					url: intent.payload.audioUrl,
				});
				return;
			case "REACTION":
				if (!intent.payload.messageRef) {
					throw new Error("REACTION_MISSING_MESSAGE_REF");
				}
				await this.provider.sendReaction({
					instanceId,
					to: intent.target.value,
					messageRef: intent.payload.messageRef,
					emoji: intent.payload.emoji,
				});
				return;
		}
	}
}


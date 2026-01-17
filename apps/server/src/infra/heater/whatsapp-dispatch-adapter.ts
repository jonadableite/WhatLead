import type {
	DispatchAction,
	DispatchPort,
	DispatchResult,
} from "../../application/heater/dispatch-port";
import type { NormalizedWhatsAppEvent } from "../../application/event-handlers/webhook-event-handler";
import type { WhatsAppProvider } from "../../application/providers/whatsapp-provider";
import {
	isPresenceCapable,
	isReactionCapable,
} from "../../application/providers/whatsapp-provider";

export class WhatsAppProviderDispatchAdapter implements DispatchPort {
	constructor(private readonly provider: WhatsAppProvider) {}

	async send(action: DispatchAction): Promise<DispatchResult> {
		switch (action.type) {
			case "SEND_TEXT": {
				const result = await this.provider.sendText({
					instanceId: action.instanceId,
					to: action.to,
					text: action.text,
					delayMs: action.delayMs,
				});

				return this.mapMessageResultToDispatchResult(
					result,
					action.instanceId,
					"MESSAGE_SENT",
					action.to,
					{ messageType: "text" },
				);
			}

			case "SEND_REACTION": {
				if (!isReactionCapable(this.provider)) {
					return {
						success: false,
						error: "Provider does not support reactions",
					};
				}

				const result = await this.provider.sendReaction({
					instanceId: action.instanceId,
					to: action.to,
					messageId: action.messageId,
					emoji: action.emoji,
				});

				return this.mapMessageResultToDispatchResult(
					result,
					action.instanceId,
					"REACTION_SENT",
					action.to,
					{ emoji: action.emoji, messageId: action.messageId },
				);
			}

			case "SET_PRESENCE": {
				if (!isPresenceCapable(this.provider)) {
					return {
						success: false,
						error: "Provider does not support presence",
					};
				}

				await this.provider.setPresence({
					instanceId: action.instanceId,
					to: action.to,
					presence: action.presence,
				});

				return { success: true, producedEvents: [] };
			}

			case "MARK_AS_READ": {
				if (!isPresenceCapable(this.provider)) {
					return {
						success: false,
						error: "Provider does not support markAsRead",
					};
				}

				await this.provider.markAsRead({
					instanceId: action.instanceId,
					messageId: action.messageId,
				});

				return {
					success: true,
					producedEvents: [
						{
							type: "MESSAGE_READ",
							instanceId: action.instanceId,
							occurredAt: new Date(),
							isGroup: false,
							messageId: action.messageId,
							metadata: {},
						},
					],
				};
			}
		}
	}

	private mapMessageResultToDispatchResult(
		result: { success: boolean; error?: string; messageId?: string; timestamp?: Date },
		instanceId: string,
		type: NormalizedWhatsAppEvent["type"],
		remoteJid: string,
		metadata: Record<string, unknown>,
	): DispatchResult {
		if (!result.success) {
			return {
				success: false,
				error: result.error ?? "Dispatch failed",
				producedEvents: [
					{
						type: "MESSAGE_FAILED",
						instanceId,
						occurredAt: new Date(),
						isGroup: false,
						remoteJid,
						messageId: result.messageId,
						metadata: { ...metadata, error: result.error },
					},
				],
			};
		}

		return {
			success: true,
			producedEvents: [
				{
					type,
					instanceId,
					occurredAt: result.timestamp ?? new Date(),
					isGroup: false,
					remoteJid,
					messageId: result.messageId,
					metadata,
				},
			],
		};
	}
}


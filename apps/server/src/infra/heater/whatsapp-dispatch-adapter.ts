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
import { getProviderInstanceName } from "../../application/instances/provider-instance-name";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";

export class WhatsAppProviderDispatchAdapter implements DispatchPort {
	constructor(
		private readonly provider: WhatsAppProvider,
		private readonly instances: InstanceRepository,
	) {}

	async send(action: DispatchAction): Promise<DispatchResult> {
		const providerInstanceId = await resolveProviderInstanceId(
			this.instances,
			action.instanceId,
		);

		switch (action.type) {
			case "SEND_TEXT": {
				const result = await this.provider.sendText({
					instanceId: providerInstanceId,
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
					instanceId: providerInstanceId,
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
					instanceId: providerInstanceId,
					to: action.to,
					presence: action.presence,
				});

				return {
					success: true,
					producedEvents: [
						{
							type: "PRESENCE_SET",
							source: "DISPATCH",
							instanceId: action.instanceId,
							occurredAt: new Date(),
							isGroup: false,
							remoteJid: action.to,
							metadata: { presence: action.presence },
						},
					],
				};
			}

			case "MARK_AS_READ": {
				if (!isPresenceCapable(this.provider)) {
					return {
						success: false,
						error: "Provider does not support markAsRead",
					};
				}

				await this.provider.markAsRead({
					instanceId: providerInstanceId,
					messageId: action.messageId,
				});

				return {
					success: true,
					producedEvents: [
						{
							type: "MESSAGE_READ",
							source: "DISPATCH",
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
		result: {
			success: boolean;
			error?: string;
			errorCode?: string;
			messageId?: string;
			timestamp?: Date;
		},
		instanceId: string,
		type: NormalizedWhatsAppEvent["type"],
		remoteJid: string,
		metadata: Record<string, unknown>,
	): DispatchResult {
		if (!result.success) {
			const now = new Date();
			const producedEvents: NormalizedWhatsAppEvent[] = [
				{
					type: "MESSAGE_FAILED",
					source: "DISPATCH",
					instanceId,
					occurredAt: now,
					isGroup: false,
					remoteJid,
					messageId: result.messageId,
					metadata: {
						...metadata,
						error: result.error,
						errorCode: result.errorCode,
					},
				},
			];

			if (result.errorCode === "HTTP_429") {
				producedEvents.push({
					type: "RATE_LIMIT_HIT",
					source: "DISPATCH",
					instanceId,
					occurredAt: now,
					isGroup: false,
					remoteJid,
					messageId: result.messageId,
					metadata: {
						...metadata,
						errorCode: result.errorCode,
					},
				});
			}

			return {
				success: false,
				error: result.error ?? "Dispatch failed",
				producedEvents,
			};
		}

		return {
			success: true,
			producedEvents: [
				{
					type,
					source: "DISPATCH",
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

const resolveProviderInstanceId = async (
	instances: InstanceRepository,
	instanceId: string,
): Promise<string> => {
	const instance = await instances.findById(instanceId);
	return instance ? getProviderInstanceName(instance) : instanceId;
};

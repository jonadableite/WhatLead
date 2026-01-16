import type { InstanceMetricRepository } from "../../domain/repositories/instance-metric-repository";
import type { ReputationSignals } from "../../domain/entities/instance-reputation";
import { InMemoryMetricStore } from "./in-memory-metric-store";

export class InMemoryInstanceMetricRepository implements InstanceMetricRepository {
	constructor(
		private readonly store: InMemoryMetricStore,
		private readonly windowMs: number = 24 * 60 * 60 * 1000,
	) {}

	async getRecentSignals(instanceId: string): Promise<ReputationSignals> {
		const now = Date.now();
		const events = this.store
			.getEvents(instanceId)
			.filter((e) => now - e.occurredAt.getTime() <= this.windowMs);

		let messagesSent = 0;
		let messagesDelivered = 0;
		let messagesReplied = 0;
		let messagesBlocked = 0;
		let humanInteractions = 0;
		let groupInteractions = 0;
		let mediaMessages = 0;
		let textMessages = 0;
		let deliveryFailures = 0;
		let reactionsReceived = 0;

		for (const event of events) {
			switch (event.type) {
				case "MESSAGE_SENT": {
					messagesSent += 1;
					const messageType = typeof event.metadata?.messageType === "string"
						? (event.metadata.messageType as string)
						: undefined;
					if (
						messageType &&
						["image", "video", "audio", "document", "sticker"].includes(messageType)
					) {
						mediaMessages += 1;
					} else {
						textMessages += 1;
					}
					break;
				}
				case "MESSAGE_DELIVERED":
					messagesDelivered += 1;
					break;
				case "MESSAGE_RECEIVED":
					messagesReplied += 1;
					humanInteractions += 1;
					break;
				case "GROUP_MESSAGE_RECEIVED":
					messagesReplied += 1;
					groupInteractions += 1;
					break;
				case "MESSAGE_FAILED":
				case "DELIVERY_FAILURE":
					deliveryFailures += 1;
					break;
				case "BLOCK_DETECTED":
					messagesBlocked += 1;
					break;
				case "REACTION_RECEIVED":
					reactionsReceived += 1;
					break;
				default:
					break;
			}
		}

		return {
			messagesSent,
			messagesDelivered,
			messagesReplied,
			messagesBlocked,
			humanInteractions,
			groupInteractions,
			mediaMessages,
			textMessages,
			averageReplyTimeInSeconds: 0,
			deliveryFailures,
			reactionsReceived,
		};
	}
}


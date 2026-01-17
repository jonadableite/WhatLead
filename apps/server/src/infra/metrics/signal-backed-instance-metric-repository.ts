import type { InstanceMetricRepository } from "../../domain/repositories/instance-metric-repository";
import type { ReputationSignalRepository } from "../../domain/repositories/reputation-signal-repository";
import type { ReputationSignals } from "../../domain/entities/instance-reputation";

const DEFAULT_WINDOW_MS = 30 * 60 * 1000;

export class SignalBackedInstanceMetricRepository implements InstanceMetricRepository {
	constructor(
		private readonly signals: ReputationSignalRepository,
		private readonly windowMs: number = DEFAULT_WINDOW_MS,
	) {}

	async getRecentSignals(instanceId: string): Promise<ReputationSignals> {
		const until = new Date();
		const since = new Date(until.getTime() - this.windowMs);
		const window = await this.signals.getWindow({ instanceId, since, until });

		let messagesSent = 0;
		let messagesDelivered = 0;
		let messagesRead = 0;
		let messagesReplied = 0;
		let reactionsSent = 0;
		let deliveryFailures = 0;
		let connectionDisconnects = 0;
		let groupInteractions = 0;
		let qrcodeRegenerations = 0;
		let presenceSets = 0;
		let rateLimitHits = 0;

		const deliveryLatencies: number[] = [];

		for (const signal of window) {
			switch (signal.type) {
				case "MESSAGE_SENT":
					messagesSent += 1;
					break;
				case "MESSAGE_DELIVERED":
					messagesDelivered += 1;
					if (typeof signal.latencyMs === "number") {
						deliveryLatencies.push(signal.latencyMs);
					}
					break;
				case "MESSAGE_READ":
					messagesRead += 1;
					break;
				case "MESSAGE_REPLIED":
					messagesReplied += 1;
					if (signal.isGroup) {
						groupInteractions += 1;
					}
					break;
				case "MESSAGE_FAILED":
					deliveryFailures += 1;
					break;
				case "REACTION_SENT":
					reactionsSent += 1;
					break;
				case "PRESENCE_SET":
					presenceSets += 1;
					break;
				case "RATE_LIMIT_HIT":
					rateLimitHits += 1;
					break;
				case "QRCODE_REGENERATED":
					qrcodeRegenerations += 1;
					break;
				case "CONNECTION_DISCONNECTED":
					connectionDisconnects += 1;
					break;
				default:
					break;
			}
		}

		const averageDeliveryLatencyMs =
			deliveryLatencies.length === 0
				? 0
				: deliveryLatencies.reduce((sum, v) => sum + v, 0) / deliveryLatencies.length;

		return {
			messagesSent,
			messagesDelivered,
			messagesRead,
			messagesReplied,
			reactionsSent,
			messagesBlocked: 0,
			humanInteractions: messagesReplied,
			groupInteractions,
			mediaMessages: 0,
			textMessages: 0,
			averageReplyTimeInSeconds: 0,
			averageDeliveryLatencyMs,
			deliveryFailures,
			reactionsReceived: 0,
			connectionDisconnects,
			qrcodeRegenerations,
			presenceSets,
			rateLimitHits,
		};
	}
}

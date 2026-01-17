import { createChildLogger } from "@WhatLead/logger";
import type { NormalizedWhatsAppEvent } from "../../application/event-handlers/webhook-event-handler";
import type { IngestReputationSignalUseCase } from "../../application/use-cases/ingest-reputation-signal.use-case";

export class LoggingIngestReputationSignalUseCase {
	private readonly logger = createChildLogger({ component: "reputation_signal_ingest" });

	constructor(private readonly inner: IngestReputationSignalUseCase) {}

	async execute(event: NormalizedWhatsAppEvent): Promise<void> {
		const result = await this.inner.execute(event);
		if (!result) {
			return;
		}

		const {
			signalsSnapshot,
			actions,
			riskLevel,
			cooldownReason,
			warmUpPhase,
			status,
		} = result;

		const deliveredRate =
			signalsSnapshot.messagesSent === 0
				? null
				: signalsSnapshot.messagesDelivered / signalsSnapshot.messagesSent;

		this.logger.info(
			{
				instanceId: event.instanceId,
				eventType: event.type,
				lifecycle: status.lifecycle,
				connection: status.connection,
				riskLevel,
				warmUpPhase,
				cooldownReason,
				actions,
				signals: {
					messagesSent: signalsSnapshot.messagesSent,
					messagesDelivered: signalsSnapshot.messagesDelivered,
					messagesRead: signalsSnapshot.messagesRead,
					messagesReplied: signalsSnapshot.messagesReplied,
					deliveryFailures: signalsSnapshot.deliveryFailures,
					averageDeliveryLatencyMs: signalsSnapshot.averageDeliveryLatencyMs,
					connectionDisconnects: signalsSnapshot.connectionDisconnects,
					deliveredRate,
				},
			},
			"Reputation signal ingested",
		);
	}
}


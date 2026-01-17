import type {
	NormalizedWhatsAppEvent,
	WebhookEventHandler,
} from "../../event-handlers/webhook-event-handler";

export interface ReputationSignalIngestor {
	execute(event: NormalizedWhatsAppEvent): Promise<unknown>;
}

export class WhatsAppWebhookApplicationHandler implements WebhookEventHandler {
	constructor(
		private readonly ingestSignal: ReputationSignalIngestor,
	) {}

	async handle(event: NormalizedWhatsAppEvent): Promise<void> {
		await this.ingestSignal.execute(event);
	}
}

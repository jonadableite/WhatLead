import type {
	NormalizedWhatsAppEvent,
	WebhookEventHandler,
} from "../../event-handlers/webhook-event-handler";

export interface ReputationSignalIngestor {
	execute(event: NormalizedWhatsAppEvent): Promise<unknown>;
}

export interface ConversationEventIngestor {
	execute(event: NormalizedWhatsAppEvent): Promise<void>;
}

export class WhatsAppWebhookApplicationHandler implements WebhookEventHandler {
	constructor(
		private readonly ingestConversation: ConversationEventIngestor,
		private readonly ingestSignal: ReputationSignalIngestor,
	) {}

	async handle(event: NormalizedWhatsAppEvent): Promise<void> {
		await this.ingestConversation.execute(event);
		await this.ingestSignal.execute(event);
	}
}

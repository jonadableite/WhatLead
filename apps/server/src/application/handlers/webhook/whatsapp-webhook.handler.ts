import type {
	NormalizedWhatsAppEvent,
	WebhookEventHandler,
} from "../../event-handlers/webhook-event-handler";
import type { MetricIngestionPort } from "../../ports/metric-ingestion-port";
import type { EvaluateInstanceHealthUseCase } from "../../../domain/use-cases/evaluate-instance-health";

export class WhatsAppWebhookApplicationHandler implements WebhookEventHandler {
	constructor(
		private readonly metricIngestion: MetricIngestionPort,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
	) {}

	async handle(event: NormalizedWhatsAppEvent): Promise<void> {
		await this.metricIngestion.record(event);
		await this.evaluateInstanceHealth.execute({
			instanceId: event.instanceId,
			reason: "WEBHOOK",
			now: event.occurredAt,
		});
	}
}


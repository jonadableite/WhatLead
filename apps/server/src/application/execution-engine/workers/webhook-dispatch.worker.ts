import type { ConversationExecutionJob } from "../../../domain/entities/conversation-execution-job";
import type { ConversationExecutionJobRepository } from "../../../domain/repositories/conversation-execution-job-repository";

export interface WebhookConfig {
	url: string;
	headers?: Record<string, string>;
	timeoutMs?: number;
}

export interface WebhookDispatchWorkerResult {
	success: boolean;
	statusCode?: number;
	error?: string;
}

export class WebhookDispatchWorker {
	constructor(
		private readonly jobRepository: ConversationExecutionJobRepository,
		private readonly webhookConfig: WebhookConfig | null,
	) {}

	async execute(job: ConversationExecutionJob): Promise<WebhookDispatchWorkerResult> {
		// Idempotency check
		if (job.status !== "RUNNING") {
			return { success: false, error: "Job not in RUNNING state" };
		}

		if (!this.webhookConfig) {
			// No webhook configured, mark as completed
			job.complete();
			await this.jobRepository.save(job);
			return { success: true };
		}

		try {
			const payload = job.payload ?? {};
			const eventType = payload.eventType as string | undefined;
			const eventId = payload.eventId as string | undefined;

			const webhookPayload = {
				eventType,
				eventId,
				conversationId: job.conversationId,
				timestamp: new Date().toISOString(),
			};

			const response = await fetch(this.webhookConfig.url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(this.webhookConfig.headers ?? {}),
				},
				body: JSON.stringify(webhookPayload),
				signal: AbortSignal.timeout(this.webhookConfig.timeoutMs ?? 10000),
			});

			if (!response.ok) {
				const errorMessage = `Webhook failed with status ${response.status}`;
				job.fail(errorMessage);
				await this.jobRepository.save(job);
				return { success: false, statusCode: response.status, error: errorMessage };
			}

			job.complete();
			await this.jobRepository.save(job);

			return { success: true, statusCode: response.status };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			job.fail(errorMessage);
			await this.jobRepository.save(job);
			return { success: false, error: errorMessage };
		}
	}
}

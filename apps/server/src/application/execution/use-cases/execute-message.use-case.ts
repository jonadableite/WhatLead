import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { ExecutionJob } from "../entities/execution-job";
import type { ExecutionWhatsAppProvider } from "../ports/whatsapp.provider";

export class ExecuteMessageUseCase {
	constructor(
		private readonly intents: MessageIntentRepository,
		private readonly provider: ExecutionWhatsAppProvider,
	) {}

	async execute(job: ExecutionJob): Promise<void> {
		const intent = await this.intents.findById(job.messageIntentId);
		if (!intent) throw new Error("MESSAGE_INTENT_NOT_FOUND");

		await this.provider.send({
			instanceId: job.instanceId,
			target: intent.target,
			payload: intent.payload,
		});

		intent.markSent();
		await this.intents.save(intent);
	}
}

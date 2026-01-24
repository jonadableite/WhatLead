import { MessageExecutionJob } from "../../domain/entities/message-execution-job";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { MessageExecutionJobRepository } from "../../domain/repositories/message-execution-job-repository";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";

export interface CreateExecutionJobUseCaseRequest {
	intentId: string;
	organizationId: string;
	now?: Date;
}

export interface CreateExecutionJobUseCaseResponse {
	jobId: string;
	created: boolean;
}

export class CreateExecutionJobUseCase {
	constructor(
		private readonly jobs: MessageExecutionJobRepository,
		private readonly intents: MessageIntentRepository,
		private readonly instances: InstanceRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(request: CreateExecutionJobUseCaseRequest): Promise<CreateExecutionJobUseCaseResponse> {
		const now = request.now ?? new Date();

		const intent = await this.intents.findById(request.intentId);
		if (!intent || intent.organizationId !== request.organizationId) {
			throw new Error("MESSAGE_INTENT_NOT_FOUND");
		}

		if (intent.status !== "APPROVED" || !intent.decidedByInstanceId) {
			throw new Error("MESSAGE_INTENT_NOT_APPROVED");
		}

		const existing = await this.jobs.findByIntentId(intent.id);
		if (existing) return { jobId: existing.id, created: false };

		const instance = await this.instances.findById(intent.decidedByInstanceId);
		if (!instance) throw new Error("NO_INSTANCE");

		const job = MessageExecutionJob.create({
			id: this.idFactory.createId(),
			intentId: intent.id,
			instanceId: instance.id,
			provider: instance.engine,
			now,
		});

		try {
			await this.jobs.create(job);
		} catch {
			const alreadyCreated = await this.jobs.findByIntentId(intent.id);
			if (alreadyCreated) return { jobId: alreadyCreated.id, created: false };
			throw new Error("MESSAGE_EXECUTION_JOB_CREATE_FAILED");
		}

		return { jobId: job.id, created: true };
	}
}

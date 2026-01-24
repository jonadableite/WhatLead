import type { MessageExecutionJobRepository } from "../../domain/repositories/message-execution-job-repository";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { OperationalEventRecord, OperationalEventRepository } from "../../domain/repositories/operational-event-repository";

export interface GetMessageIntentTimelineUseCaseRequest {
	intentId: string;
	organizationId: string;
	limit?: number;
}

export interface GetMessageIntentTimelineUseCaseResponse {
	intent: {
		id: string;
		organizationId: string;
		status: string;
		purpose: string;
		type: string;
		target: any;
		decidedByInstanceId: string | null;
		blockedReason: string | null;
		queuedUntil: Date | null;
		createdAt: Date;
	};
	job: {
		id: string;
		instanceId: string;
		provider: string;
		status: string;
		attempts: number;
		lastError: string | null;
		createdAt: Date;
		executedAt: Date | null;
		nextAttemptAt: Date | null;
	} | null;
	events: OperationalEventRecord[];
}

export class GetMessageIntentTimelineUseCase {
	constructor(
		private readonly intents: MessageIntentRepository,
		private readonly jobs: MessageExecutionJobRepository,
		private readonly events: OperationalEventRepository,
	) {}

	async execute(
		request: GetMessageIntentTimelineUseCaseRequest,
	): Promise<GetMessageIntentTimelineUseCaseResponse> {
		const intent = await this.intents.findById(request.intentId);
		if (!intent || intent.organizationId !== request.organizationId) {
			throw new Error("MESSAGE_INTENT_NOT_FOUND");
		}

		const job = await this.jobs.findByIntentId(intent.id);
		const stored = await this.events.listByAggregate({
			organizationId: request.organizationId,
			aggregateType: "MESSAGE_INTENT",
			aggregateId: intent.id,
			limit: request.limit ?? 200,
		});

		const syntheticCreated: OperationalEventRecord = {
			id: `synthetic:${intent.id}:created`,
			organizationId: intent.organizationId,
			aggregateType: "MESSAGE_INTENT",
			aggregateId: intent.id,
			eventType: "MessageIntentCreated",
			payload: { intentId: intent.id },
			occurredAt: intent.createdAt,
			createdAt: new Date(),
		};

		const events = [syntheticCreated, ...stored].sort(
			(a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
		);

		return {
			intent: {
				id: intent.id,
				organizationId: intent.organizationId,
				status: intent.status,
				purpose: intent.purpose,
				type: intent.type,
				target: intent.target,
				decidedByInstanceId: intent.decidedByInstanceId,
				blockedReason: intent.blockedReason,
				queuedUntil: intent.queuedUntil,
				createdAt: intent.createdAt,
			},
			job: job
				? {
						id: job.id,
						instanceId: job.instanceId,
						provider: job.provider,
						status: job.status,
						attempts: job.attempts,
						lastError: job.lastError,
						createdAt: job.createdAt,
						executedAt: job.executedAt,
						nextAttemptAt: job.nextAttemptAt,
					}
				: null,
			events,
		};
	}
}


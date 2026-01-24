import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { MessageExecutionDomainEvent } from "../../domain/events/message-execution-events";
import type { MessageExecutionJobRepository } from "../../domain/repositories/message-execution-job-repository";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { ExecutionControlPolicy } from "../ops/execution-control-policy";
import { MessageIntentExecutorService } from "./message-intent-executor.service";

export interface ExecuteMessageIntentUseCaseRequest {
	jobId: string;
	now?: Date;
}

export type ExecuteMessageIntentUseCaseResponse =
	| { status: "SKIPPED" }
	| { status: "SENT" }
	| { status: "FAILED"; willRetry: boolean; error: string };

export class ExecuteMessageIntentUseCase {
	static readonly DEFAULT_MAX_ATTEMPTS = 5;

	private readonly executor: MessageIntentExecutorService;

	constructor(
		private readonly jobs: MessageExecutionJobRepository,
		private readonly intents: MessageIntentRepository,
		executor: MessageIntentExecutorService,
		private readonly eventBus: DomainEventBus<MessageExecutionDomainEvent>,
		private readonly executionControl: ExecutionControlPolicy | null,
		private readonly maxAttempts: number = ExecuteMessageIntentUseCase.DEFAULT_MAX_ATTEMPTS,
	) {
		this.executor = executor;
	}

	async execute(request: ExecuteMessageIntentUseCaseRequest): Promise<ExecuteMessageIntentUseCaseResponse> {
		const now = request.now ?? new Date();
		const job = await this.jobs.tryClaim(request.jobId, now);
		if (!job) return { status: "SKIPPED" };

		const intent = await this.intents.findById(job.intentId);
		if (!intent) {
			const events = job.markFailed({
				intentId: job.intentId,
				error: "MESSAGE_INTENT_NOT_FOUND",
				willRetry: false,
				now,
			});
			await this.jobs.save(job);
			await this.eventBus.publishMany(events);
			return { status: "FAILED", willRetry: false, error: "MESSAGE_INTENT_NOT_FOUND" };
		}

		if (intent.status !== "APPROVED" || intent.decidedByInstanceId !== job.instanceId) {
			const events = job.markFailed({
				intentId: intent.id,
				error: "MESSAGE_INTENT_NOT_APPROVED",
				willRetry: false,
				now,
			});
			await this.jobs.save(job);
			await this.eventBus.publishMany(events);
			return { status: "FAILED", willRetry: false, error: "MESSAGE_INTENT_NOT_APPROVED" };
		}

		try {
			if (this.executionControl) {
				const decision = await this.executionControl.canExecute({
					organizationId: intent.organizationId,
					instanceId: job.instanceId,
					now,
				});
				if (!decision.allowed) throw new Error("OPS_PAUSED");
			}
			await this.executor.execute({ intent, instanceId: job.instanceId });
			intent.markSent();
			const events = job.markSent({ intentId: intent.id, now });
			await this.intents.save(intent);
			await this.jobs.save(job);
			await this.eventBus.publishMany(events);
			return { status: "SENT" };
		} catch (err) {
			const error = err instanceof Error ? err.message : "EXECUTION_FAILED";
			const isPermanent = error === "REACTION_MISSING_MESSAGE_REF";
			const willRetry = !isPermanent && job.attempts < this.maxAttempts;

			const events = job.markFailed({
				intentId: intent.id,
				error,
				willRetry,
				now,
			});
			await this.jobs.save(job);
			await this.eventBus.publishMany(events);
			return { status: "FAILED", willRetry, error };
		}
	}
}

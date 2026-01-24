import type { MessageExecutionJobRepository } from "../../domain/repositories/message-execution-job-repository";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { MessageExecutionStatus } from "../../domain/value-objects/message-execution-status";
import {
	toExecutionJobListItemViewModel,
	type ExecutionJobListItemViewModel,
} from "./execution-job-list-view-model";

export interface ListExecutionJobsUseCaseRequest {
	organizationId: string;
	intentId: string;
	status?: MessageExecutionStatus;
	limit?: number;
}

export interface ListExecutionJobsUseCaseResponse {
	items: ExecutionJobListItemViewModel[];
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class ListExecutionJobsUseCase {
	constructor(
		private readonly intents: MessageIntentRepository,
		private readonly jobs: MessageExecutionJobRepository,
	) {}

	async execute(
		request: ListExecutionJobsUseCaseRequest,
	): Promise<ListExecutionJobsUseCaseResponse> {
		const intent = await this.intents.findById(request.intentId);
		if (!intent || intent.organizationId !== request.organizationId) {
			throw new Error("MESSAGE_INTENT_NOT_FOUND");
		}

		const limit = normalizeLimit(request.limit);
		const items = await this.jobs.listByIntentId(request.intentId, limit, request.status);
		return { items: items.map(toExecutionJobListItemViewModel) };
	}
}

const normalizeLimit = (limit?: number): number => {
	if (!limit || Number.isNaN(limit)) return DEFAULT_LIMIT;
	if (limit <= 0) return DEFAULT_LIMIT;
	return Math.min(limit, MAX_LIMIT);
};

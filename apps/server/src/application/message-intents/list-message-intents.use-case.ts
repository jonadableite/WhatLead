import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { MessageIntentPurpose } from "../../domain/value-objects/message-intent-purpose";
import type { MessageIntentStatus } from "../../domain/value-objects/message-intent-status";
import {
	toMessageIntentListItemViewModel,
	type MessageIntentListItemViewModel,
} from "./message-intent-list-view-model";

export interface ListMessageIntentsUseCaseRequest {
	organizationId: string;
	status?: MessageIntentStatus;
	purpose?: MessageIntentPurpose;
	instanceId?: string;
	limit?: number;
}

export interface ListMessageIntentsUseCaseResponse {
	items: MessageIntentListItemViewModel[];
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export class ListMessageIntentsUseCase {
	constructor(private readonly intents: MessageIntentRepository) {}

	async execute(
		request: ListMessageIntentsUseCaseRequest,
	): Promise<ListMessageIntentsUseCaseResponse> {
		const normalizedLimit = normalizeLimit(request.limit);
		const items = await this.intents.listByFilters({
			organizationId: request.organizationId,
			status: request.status,
			purpose: request.purpose,
			instanceId: request.instanceId,
			limit: normalizedLimit,
		});

		return { items: items.map(toMessageIntentListItemViewModel) };
	}
}

const normalizeLimit = (limit?: number): number => {
	if (!limit || Number.isNaN(limit)) return DEFAULT_LIMIT;
	if (limit <= 0) return DEFAULT_LIMIT;
	return Math.min(limit, MAX_LIMIT);
};

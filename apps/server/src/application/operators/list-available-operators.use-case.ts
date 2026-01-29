import type { OperatorRepository } from "../../domain/repositories/operator-repository";
import type { OperatorStatus } from "../../domain/value-objects/operator-status";

export interface ListAvailableOperatorsUseCaseRequest {
	organizationId: string;
	status?: OperatorStatus;
	limit?: number;
}

export interface ListAvailableOperatorsUseCaseResponse {
	items: Array<{
		id: string;
		userId: string;
		name: string;
		status: OperatorStatus;
		maxConcurrentConversations: number;
		currentConversationCount: number;
	}>;
}

export class ListAvailableOperatorsUseCase {
	constructor(private readonly operators: OperatorRepository) {}

	async execute(
		request: ListAvailableOperatorsUseCaseRequest,
	): Promise<ListAvailableOperatorsUseCaseResponse> {
		const limit = Math.min(Math.max(request.limit ?? 50, 1), 200);
		const items = await this.operators.listAvailable({
			organizationId: request.organizationId,
			status: request.status,
			limit,
		});

		return {
			items: items.map((operator) => ({
				id: operator.id,
				userId: operator.userId,
				name: operator.name,
				status: operator.status,
				maxConcurrentConversations: operator.maxConcurrentConversations,
				currentConversationCount: operator.currentConversationCount,
			})),
		};
	}
}

import type { OperatorRepository } from "../../domain/repositories/operator-repository";
import type { OperatorStatus } from "../../domain/value-objects/operator-status";

export interface GetOperatorByUserUseCaseRequest {
	organizationId: string;
	userId: string;
}

export interface GetOperatorByUserUseCaseResponse {
	operator: {
		id: string;
		userId: string;
		name: string;
		status: OperatorStatus;
		maxConcurrentConversations: number;
		currentConversationCount: number;
	} | null;
}

export class GetOperatorByUserUseCase {
	constructor(private readonly operators: OperatorRepository) {}

	async execute(
		request: GetOperatorByUserUseCaseRequest,
	): Promise<GetOperatorByUserUseCaseResponse> {
		const operator = await this.operators.findByUserId({
			organizationId: request.organizationId,
			userId: request.userId,
		});
		if (!operator) {
			return { operator: null };
		}
		return {
			operator: {
				id: operator.id,
				userId: operator.userId,
				name: operator.name,
				status: operator.status,
				maxConcurrentConversations: operator.maxConcurrentConversations,
				currentConversationCount: operator.currentConversationCount,
			},
		};
	}
}

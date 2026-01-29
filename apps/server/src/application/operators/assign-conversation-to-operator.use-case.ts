import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { OperatorRepository } from "../../domain/repositories/operator-repository";

export interface AssignConversationToOperatorUseCaseRequest {
	organizationId: string;
	conversationId: string;
	operatorId: string;
}

export class AssignConversationToOperatorUseCase {
	constructor(
		private readonly conversations: ConversationRepository,
		private readonly operators: OperatorRepository,
	) {}

	async execute(request: AssignConversationToOperatorUseCaseRequest): Promise<void> {
		const conversation = await this.conversations.findById({ id: request.conversationId });
		if (!conversation || conversation.tenantId !== request.organizationId) {
			throw new Error("CONVERSATION_NOT_FOUND");
		}

		const operator = await this.operators.findById(request.operatorId);
		if (!operator || operator.organizationId !== request.organizationId) {
			throw new Error("OPERATOR_NOT_FOUND");
		}

		if (!operator.isAvailable()) {
			throw new Error("OPERATOR_UNAVAILABLE");
		}

		const assigned = await this.conversations.assignOperatorIfUnassigned({
			conversationId: conversation.id,
			operatorId: operator.id,
		});
		if (!assigned) {
			throw new Error("CONVERSATION_ALREADY_ASSIGNED");
		}

		operator.claimConversation();

		const count = await this.operators.recalculateConversationCount({ operatorId: operator.id });
		operator.setConversationCount(count);
		await this.operators.save(operator);
	}
}

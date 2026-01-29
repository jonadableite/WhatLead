import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { OperatorRepository } from "../../domain/repositories/operator-repository";

export interface ReleaseConversationUseCaseRequest {
	organizationId: string;
	conversationId: string;
	operatorId: string;
}

export class ReleaseConversationUseCase {
	constructor(
		private readonly conversations: ConversationRepository,
		private readonly operators: OperatorRepository,
	) {}

	async execute(request: ReleaseConversationUseCaseRequest): Promise<void> {
		const conversation = await this.conversations.findById({ id: request.conversationId });
		if (!conversation || conversation.tenantId !== request.organizationId) {
			throw new Error("CONVERSATION_NOT_FOUND");
		}

		if (conversation.assignedOperatorId !== request.operatorId) {
			throw new Error("OPERATOR_NOT_ASSIGNED");
		}

		const operator = await this.operators.findById(request.operatorId);
		if (!operator || operator.organizationId !== request.organizationId) {
			throw new Error("OPERATOR_NOT_FOUND");
		}

		conversation.releaseOperator();
		operator.releaseConversation();

		await this.conversations.save(conversation);
		const count = await this.operators.recalculateConversationCount({ operatorId: operator.id });
		operator.setConversationCount(count);
		await this.operators.save(operator);
	}
}

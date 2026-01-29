import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { OperatorRepository } from "../../domain/repositories/operator-repository";

export interface TransferConversationUseCaseRequest {
	organizationId: string;
	conversationId: string;
	fromOperatorId: string;
	toOperatorId: string;
}

export class TransferConversationUseCase {
	constructor(
		private readonly conversations: ConversationRepository,
		private readonly operators: OperatorRepository,
	) {}

	async execute(request: TransferConversationUseCaseRequest): Promise<void> {
		const conversation = await this.conversations.findById({ id: request.conversationId });
		if (!conversation || conversation.tenantId !== request.organizationId) {
			throw new Error("CONVERSATION_NOT_FOUND");
		}

		if (conversation.assignedOperatorId !== request.fromOperatorId) {
			throw new Error("OPERATOR_NOT_ASSIGNED");
		}

		const fromOperator = await this.operators.findById(request.fromOperatorId);
		if (!fromOperator || fromOperator.organizationId !== request.organizationId) {
			throw new Error("OPERATOR_NOT_FOUND");
		}

		const toOperator = await this.operators.findById(request.toOperatorId);
		if (!toOperator || toOperator.organizationId !== request.organizationId) {
			throw new Error("OPERATOR_NOT_FOUND");
		}

		if (!toOperator.isAvailable()) {
			throw new Error("OPERATOR_UNAVAILABLE");
		}

		conversation.assignOperator(toOperator.id);
		fromOperator.releaseConversation();
		toOperator.claimConversation();

		await this.conversations.save(conversation);
		const [fromCount, toCount] = await Promise.all([
			this.operators.recalculateConversationCount({ operatorId: fromOperator.id }),
			this.operators.recalculateConversationCount({ operatorId: toOperator.id }),
		]);
		fromOperator.setConversationCount(fromCount);
		toOperator.setConversationCount(toCount);
		await this.operators.save(fromOperator);
		await this.operators.save(toOperator);
	}
}

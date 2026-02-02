import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { RoutingDecision } from "./routing-decision";

export class AssignConversationUseCase {
	constructor(private readonly conversations: ConversationRepository) {}

	async execute(params: { conversationId: string; decision: RoutingDecision }): Promise<void> {
		const conversation = await this.conversations.findById({ id: params.conversationId });
		if (!conversation) {
			return;
		}

		if (params.decision.assignAgentId) {
			conversation.assign(params.decision.assignAgentId);
			await this.conversations.saveEvent({
				conversationId: conversation.id,
				type: "ASSIGNMENT",
				assignedTo: { type: "AI", id: params.decision.assignAgentId },
				createdAt: new Date(),
			});
		} else if (params.decision.assignOperatorId) {
			conversation.assignOperator(params.decision.assignOperatorId);
			await this.conversations.saveEvent({
				conversationId: conversation.id,
				type: "ASSIGNMENT",
				assignedTo: { type: "OPERATOR", id: params.decision.assignOperatorId },
				createdAt: new Date(),
			});
		} else if (params.decision.markWaiting) {
			conversation.markAsWaiting();
		}

		await this.conversations.save(conversation);
	}
}


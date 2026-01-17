export type ConversationDomainEvent =
	| { type: "CONVERSATION_SLA_BREACHED"; conversationId: string; occurredAt: Date }
	| { type: "CONVERSATION_STAGE_CHANGED"; conversationId: string; from: string; to: string; occurredAt: Date }
	| { type: "CONVERSATION_ASSIGNED"; conversationId: string; agentId: string; occurredAt: Date };


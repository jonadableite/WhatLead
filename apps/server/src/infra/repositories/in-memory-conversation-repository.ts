import type {
	ConversationListResult,
	ConversationMessagesResult,
	ConversationRepository,
} from "../../domain/repositories/conversation-repository";
import type { Conversation } from "../../domain/entities/conversation";
import type { ConversationStatus } from "../../domain/value-objects/conversation-status";

export class InMemoryConversationRepository implements ConversationRepository {
	private readonly byId = new Map<string, Conversation>();

	async findActiveByInstanceAndContact(params: {
		instanceId: string;
		contactId: string;
	}): Promise<Conversation | null> {
		for (const conversation of this.byId.values()) {
			if (
				conversation.isActive &&
				conversation.instanceId === params.instanceId &&
				conversation.contactId === params.contactId
			) {
				return conversation;
			}
		}
		return null;
	}

	async findActiveByInstanceAndLead(params: {
		instanceId: string;
		leadId: string;
	}): Promise<Conversation | null> {
		for (const conversation of this.byId.values()) {
			if (
				conversation.isActive &&
				conversation.instanceId === params.instanceId &&
				conversation.leadId === params.leadId
			) {
				return conversation;
			}
		}
		return null;
	}

	async save(conversation: Conversation): Promise<void> {
		this.byId.set(conversation.id, conversation);
	}

	async findById(params: { id: string }): Promise<Conversation | null> {
		return this.byId.get(params.id) ?? null;
	}

	async assignOperatorIfUnassigned(params: {
		conversationId: string;
		operatorId: string;
	}): Promise<boolean> {
		const conversation = this.byId.get(params.conversationId);
		if (!conversation || !conversation.isActive) {
			return false;
		}
		if (conversation.assignedOperatorId || conversation.assignedAgentId) {
			return false;
		}
		conversation.assignOperator(params.operatorId);
		this.byId.set(conversation.id, conversation);
		return true;
	}

	async listByInstance(params: {
		tenantId: string;
		instanceId: string;
		status?: ConversationStatus;
		search?: string;
		operatorId?: string;
		includeUnassigned?: boolean;
		limit: number;
		offset: number;
	}): Promise<ConversationListResult> {
		const items = Array.from(this.byId.values()).filter((conversation) => {
			if (conversation.tenantId !== params.tenantId) return false;
			if (conversation.instanceId !== params.instanceId) return false;
			if (params.status && conversation.status !== params.status) return false;
			if (params.search && !conversation.contactId.includes(params.search)) return false;
			if (params.operatorId) {
				const isAssignedToOperator = conversation.assignedOperatorId === params.operatorId;
				const isUnassigned =
					!conversation.assignedOperatorId &&
					!conversation.assignedAgentId &&
					params.includeUnassigned !== false;
				if (!isAssignedToOperator && !isUnassigned) return false;
			}
			return true;
		});

		const paged = items.slice(params.offset, params.offset + params.limit);
		return {
			items: paged.map((conversation) => ({
				id: conversation.id,
				instanceId: conversation.instanceId,
				contactId: conversation.contactId,
				contactName: null,
				profilePicUrl: null,
				status: conversation.status,
				assignedAgentId: conversation.assignedAgentId,
				assignedOperatorId: conversation.assignedOperatorId,
				unreadCount: conversation.unreadCount,
				lastMessageAt: conversation.lastMessageAt,
				lastMessage: null,
			})),
			total: items.length,
		};
	}

	async getMessagesWithContent(_params: {
		conversationId: string;
		limit: number;
		cursor?: string;
	}): Promise<ConversationMessagesResult> {
		return { items: [] };
	}
}

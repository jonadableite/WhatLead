import type { Conversation } from "../entities/conversation";
import type { ConversationStatus } from "../value-objects/conversation-status";
import type { MessageDirection } from "../value-objects/message-direction";
import type { MessageSender } from "../value-objects/message-sender";
import type { MessageType } from "../value-objects/message-type";

export interface ConversationListItem {
	id: string;
	instanceId: string;
	contactId: string;
	contactName?: string | null;
	status: ConversationStatus;
	assignedAgentId?: string | null;
	assignedOperatorId?: string | null;
	unreadCount: number;
	lastMessageAt: Date;
	lastMessage?: {
		body: string;
		direction: MessageDirection;
		type: MessageType;
		sentBy: MessageSender;
		occurredAt: Date;
	} | null;
}

export interface ConversationMessageItem {
	id: string;
	direction: MessageDirection;
	type: MessageType;
	sentBy: MessageSender;
	status: "PENDING" | "SENT" | "FAILED";
	body: string;
	occurredAt: Date;
}

export interface ConversationListResult {
	items: ConversationListItem[];
	total: number;
}

export interface ConversationMessagesResult {
	items: ConversationMessageItem[];
	nextCursor?: string;
}

export interface ConversationRepository {
	findActiveByInstanceAndContact(params: {
		instanceId: string;
		contactId: string;
	}): Promise<Conversation | null>;

	findActiveByInstanceAndLead(params: {
		instanceId: string;
		leadId: string;
	}): Promise<Conversation | null>;

	findById(params: { id: string }): Promise<Conversation | null>;

	save(conversation: Conversation): Promise<void>;

	assignOperatorIfUnassigned(params: {
		conversationId: string;
		operatorId: string;
	}): Promise<boolean>;

	listByInstance(params: {
		tenantId: string;
		instanceId: string;
		status?: ConversationStatus;
		search?: string;
		operatorId?: string;
		includeUnassigned?: boolean;
		limit: number;
		offset: number;
	}): Promise<ConversationListResult>;

	getMessagesWithContent(params: {
		conversationId: string;
		limit: number;
		cursor?: string;
	}): Promise<ConversationMessagesResult>;
}

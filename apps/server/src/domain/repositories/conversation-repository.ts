import type { Conversation } from "../entities/conversation";
import type { ConversationTimelineEvent } from "../entities/conversation-timeline-event";
import type { ConversationStatus } from "../value-objects/conversation-status";
import type { MessageDirection } from "../value-objects/message-direction";
import type { MessageSender } from "../value-objects/message-sender";
import type { MessageType } from "../value-objects/message-type";

export interface ConversationListItem {
	id: string;
	instanceId: string;
	contactId: string;
	contactName?: string | null;
	profilePicUrl?: string | null;
	status: ConversationStatus;
	assignedAgentId?: string | null;
	assignedOperatorId?: string | null;
	// Unread count for human operator inbox; AI should not depend on this.
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
	media?: {
		url?: string;
		base64?: string;
		mimeType?: string;
		caption?: string;
	};
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

export interface ConversationTimelineResult {
	items: ConversationTimelineEvent[];
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

	saveEvent(event: ConversationTimelineEvent & { conversationId: string }): Promise<void>;

	findTimeline(params: {
		conversationId: string;
		limit: number;
		cursor?: string;
	}): Promise<ConversationTimelineResult>;
}

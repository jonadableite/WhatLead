import type { ConversationStatus } from "../../domain/value-objects/conversation-status";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";

export interface ListConversationsUseCaseRequest {
	tenantId: string;
	instanceId: string;
	status?: ConversationStatus;
	search?: string;
	operatorId?: string;
	includeUnassigned?: boolean;
	limit?: number;
	offset?: number;
}

export interface ListConversationsUseCaseResponse {
	items: Array<{
		id: string;
		instanceId: string;
		contactId: string;
		contactName?: string | null;
		status: ConversationStatus;
		assignedAgentId?: string | null;
		assignedOperatorId?: string | null;
		unreadCount: number;
		lastMessageAt: string;
		lastMessage?: {
			body: string;
			direction: string;
			type: string;
			sentBy: string;
			occurredAt: string;
		} | null;
	}>;
	total: number;
}

export class ListConversationsUseCase {
	constructor(private readonly conversations: ConversationRepository) {}

	async execute(
		request: ListConversationsUseCaseRequest,
	): Promise<ListConversationsUseCaseResponse> {
		const limit = Math.min(Math.max(request.limit ?? 50, 1), 200);
		const offset = Math.max(request.offset ?? 0, 0);

		const result = await this.conversations.listByInstance({
			tenantId: request.tenantId,
			instanceId: request.instanceId,
			status: request.status,
			search: request.search,
			operatorId: request.operatorId,
			includeUnassigned: request.includeUnassigned,
			limit,
			offset,
		});

		return {
			items: result.items.map((item) => ({
				id: item.id,
				instanceId: item.instanceId,
				contactId: item.contactId,
				contactName: item.contactName ?? null,
				status: item.status,
				assignedAgentId: item.assignedAgentId ?? null,
				assignedOperatorId: item.assignedOperatorId ?? null,
				unreadCount: item.unreadCount,
				lastMessageAt: item.lastMessageAt.toISOString(),
				lastMessage: item.lastMessage
					? {
							body: item.lastMessage.body,
							direction: item.lastMessage.direction,
							type: item.lastMessage.type,
							sentBy: item.lastMessage.sentBy,
							occurredAt: item.lastMessage.occurredAt.toISOString(),
						}
					: null,
			})),
			total: result.total,
		};
	}
}

import prisma from "@WhatLead/db";
import { Conversation } from "../../domain/entities/conversation";
import { ConversationSLA } from "../../domain/value-objects/conversation-sla";
import { formatContactLabel } from "../../application/conversations/contact-utils";
import type {
	ConversationListResult,
	ConversationMessagesResult,
	ConversationRepository,
} from "../../domain/repositories/conversation-repository";
import type { ConversationStatus } from "../../domain/value-objects/conversation-status";
import type { MessageDirection } from "../../domain/value-objects/message-direction";
import type { MessageSender } from "../../domain/value-objects/message-sender";
import type { MessageType } from "../../domain/value-objects/message-type";

export class PrismaConversationRepository implements ConversationRepository {
	async findActiveByInstanceAndContact(params: {
		instanceId: string;
		contactId: string;
	}): Promise<Conversation | null> {
		const row = await prisma.conversation.findFirst({
			where: {
				instanceId: params.instanceId,
				contactId: params.contactId,
				isActive: true,
			},
		});

		if (!row) {
			return null;
		}

		return Conversation.reconstitute({
			id: row.id,
			tenantId: row.tenantId,
			channel: row.channel as any,
			instanceId: row.instanceId,
			contactId: row.contactId,
			leadId: (row as any).leadId ?? null,
			status: row.status as any,
			stage: (row as any).stage as any,
			assignedAgentId: row.assignedAgentId ?? null,
			assignedOperatorId: (row as any).assignedOperatorId ?? null,
			openedAt: row.openedAt,
			lastMessageAt: row.lastMessageAt,
			lastInboundAt: (row as any).lastInboundAt ?? null,
			lastOutboundAt: (row as any).lastOutboundAt ?? null,
			unreadCount: (row as any).unreadCount ?? 0,
			metadata: ((row as any).metadata ?? {}) as any,
			sla:
				row.firstResponseDueAt || row.nextResponseDueAt || (row as any).slaBreachedAt
					? ConversationSLA.reconstitute({
							firstResponseDueAt: (row as any).firstResponseDueAt ?? null,
							nextResponseDueAt: (row as any).nextResponseDueAt ?? null,
							breachedAt: (row as any).slaBreachedAt ?? null,
						})
					: null,
			isActive: row.isActive,
		});
	}

	async findActiveByInstanceAndLead(params: {
		instanceId: string;
		leadId: string;
	}): Promise<Conversation | null> {
		const row = await prisma.conversation.findFirst({
			where: {
				instanceId: params.instanceId,
				leadId: params.leadId,
				isActive: true,
			},
		});

		if (!row) {
			return null;
		}

		return Conversation.reconstitute({
			id: row.id,
			tenantId: row.tenantId,
			channel: row.channel as any,
			instanceId: row.instanceId,
			contactId: row.contactId,
			leadId: (row as any).leadId ?? null,
			status: row.status as any,
			stage: (row as any).stage as any,
			assignedAgentId: row.assignedAgentId ?? null,
			assignedOperatorId: (row as any).assignedOperatorId ?? null,
			openedAt: row.openedAt,
			lastMessageAt: row.lastMessageAt,
			lastInboundAt: (row as any).lastInboundAt ?? null,
			lastOutboundAt: (row as any).lastOutboundAt ?? null,
			unreadCount: (row as any).unreadCount ?? 0,
			metadata: ((row as any).metadata ?? {}) as any,
			sla:
				row.firstResponseDueAt || row.nextResponseDueAt || (row as any).slaBreachedAt
					? ConversationSLA.reconstitute({
							firstResponseDueAt: (row as any).firstResponseDueAt ?? null,
							nextResponseDueAt: (row as any).nextResponseDueAt ?? null,
							breachedAt: (row as any).slaBreachedAt ?? null,
						})
					: null,
			isActive: row.isActive,
		});
	}

	async findById(params: { id: string }): Promise<Conversation | null> {
		const row = await prisma.conversation.findUnique({
			where: { id: params.id },
		});
		if (!row) {
			return null;
		}
		return Conversation.reconstitute({
			id: row.id,
			tenantId: row.tenantId,
			channel: row.channel as any,
			instanceId: row.instanceId,
			contactId: row.contactId,
			leadId: (row as any).leadId ?? null,
			status: row.status as any,
			stage: (row as any).stage as any,
			assignedAgentId: row.assignedAgentId ?? null,
			assignedOperatorId: (row as any).assignedOperatorId ?? null,
			openedAt: row.openedAt,
			lastMessageAt: row.lastMessageAt,
			lastInboundAt: (row as any).lastInboundAt ?? null,
			lastOutboundAt: (row as any).lastOutboundAt ?? null,
			unreadCount: (row as any).unreadCount ?? 0,
			metadata: ((row as any).metadata ?? {}) as any,
			sla:
				row.firstResponseDueAt || row.nextResponseDueAt || (row as any).slaBreachedAt
					? ConversationSLA.reconstitute({
							firstResponseDueAt: (row as any).firstResponseDueAt ?? null,
							nextResponseDueAt: (row as any).nextResponseDueAt ?? null,
							breachedAt: (row as any).slaBreachedAt ?? null,
						})
					: null,
			isActive: row.isActive,
		});
	}

	async save(conversation: Conversation): Promise<void> {
		await prisma.conversation.upsert({
			where: { id: conversation.id },
			create: {
				id: conversation.id,
				tenantId: conversation.tenantId,
				channel: conversation.channel,
				instanceId: conversation.instanceId,
				contactId: conversation.contactId,
				leadId: conversation.leadId,
				status: conversation.status,
				stage: conversation.stage,
				isActive: conversation.isActive,
				assignedAgentId: conversation.assignedAgentId,
				assignedOperatorId: conversation.assignedOperatorId,
				openedAt: conversation.openedAt,
				lastMessageAt: conversation.lastMessageAt,
				lastInboundAt: conversation.lastInboundAt,
				lastOutboundAt: conversation.lastOutboundAt,
				unreadCount: conversation.unreadCount,
				metadata: conversation.metadata as any,
				firstResponseDueAt: conversation.sla?.firstResponseDueAt ?? null,
				nextResponseDueAt: conversation.sla?.nextResponseDueAt ?? null,
				slaBreachedAt: conversation.sla?.breachedAt ?? null,
			},
			update: {
				leadId: conversation.leadId,
				status: conversation.status,
				stage: conversation.stage,
				isActive: conversation.isActive,
				assignedAgentId: conversation.assignedAgentId,
				assignedOperatorId: conversation.assignedOperatorId,
				lastMessageAt: conversation.lastMessageAt,
				lastInboundAt: conversation.lastInboundAt,
				lastOutboundAt: conversation.lastOutboundAt,
				unreadCount: conversation.unreadCount,
				metadata: conversation.metadata as any,
				firstResponseDueAt: conversation.sla?.firstResponseDueAt ?? null,
				nextResponseDueAt: conversation.sla?.nextResponseDueAt ?? null,
				slaBreachedAt: conversation.sla?.breachedAt ?? null,
			},
		});
	}

	async assignOperatorIfUnassigned(params: {
		conversationId: string;
		operatorId: string;
	}): Promise<boolean> {
		const result = await prisma.conversation.updateMany({
			where: {
				id: params.conversationId,
				assignedOperatorId: null,
				assignedAgentId: null,
				isActive: true,
			},
			data: {
				assignedOperatorId: params.operatorId,
				assignedAgentId: null,
				status: "OPEN",
			},
		});
		return result.count > 0;
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
		const assignmentFilters = params.operatorId
			? [
					{ assignedOperatorId: params.operatorId },
					...(params.includeUnassigned === false
						? []
						: [{ assignedOperatorId: null, assignedAgentId: null }]),
				]
			: [];

		const where = {
			tenantId: params.tenantId,
			instanceId: params.instanceId,
			...(params.status ? { status: params.status } : {}),
			...(params.search
				? {
						OR: [
							{ contactId: { contains: params.search, mode: "insensitive" } },
							{ lead: { name: { contains: params.search, mode: "insensitive" } } },
						],
					}
				: {}),
			...(assignmentFilters.length > 0 ? { OR: assignmentFilters } : {}),
		};

		const [rows, total] = await Promise.all([
			prisma.conversation.findMany({
				where,
				orderBy: { lastMessageAt: "desc" },
				skip: params.offset,
				take: params.limit,
				include: {
					lead: { select: { name: true, phone: true, lid: true } },
					messages: {
						orderBy: { occurredAt: "desc" },
						take: 1,
					},
				},
			}),
			prisma.conversation.count({ where }),
		]);

		return {
			items: rows.map((row) => {
				const last = row.messages[0];
				return {
					id: row.id,
					instanceId: row.instanceId,
					contactId: row.contactId,
					contactName: formatContactLabel({
						leadName: row.lead?.name ?? null,
						phone: row.lead?.phone ?? null,
						lid: (row.lead as any)?.lid ?? null,
						contactId: row.contactId,
					}),
					status: row.status as ConversationStatus,
					assignedAgentId: row.assignedAgentId ?? null,
					assignedOperatorId: (row as any).assignedOperatorId ?? null,
					unreadCount: (row as any).unreadCount ?? 0,
					lastMessageAt: row.lastMessageAt,
					lastMessage: last
						? {
								body: resolveMessageBody(last.contentRef, last.metadata),
								direction: last.direction as MessageDirection,
								type: last.type as MessageType,
								sentBy: last.sentBy as MessageSender,
								occurredAt: last.occurredAt,
							}
						: null,
				};
			}),
			total,
		};
	}

	async getMessagesWithContent(params: {
		conversationId: string;
		limit: number;
		cursor?: string;
	}): Promise<ConversationMessagesResult> {
		const rows = await prisma.message.findMany({
			where: { conversationId: params.conversationId },
			orderBy: { occurredAt: "desc" },
			take: params.limit + 1,
			...(params.cursor
				? {
						cursor: { id: params.cursor },
						skip: 1,
					}
				: {}),
		});

		const hasMore = rows.length > params.limit;
		const sliced = hasMore ? rows.slice(0, params.limit) : rows;
		const items = sliced
			.map((row) => ({
				id: row.id,
				direction: row.direction as MessageDirection,
				type: row.type as MessageType,
				sentBy: row.sentBy as MessageSender,
				status: (row as any).status as "PENDING" | "SENT" | "FAILED",
				body: resolveMessageBody(row.contentRef, row.metadata),
				occurredAt: row.occurredAt,
			}))
			.reverse();

		return {
			items,
			nextCursor: hasMore ? sliced[sliced.length - 1]?.id : undefined,
		};
	}
}

const resolveMessageBody = (contentRef: string | null, metadata: unknown): string => {
	if (contentRef && String(contentRef).trim()) return String(contentRef);
	if (metadata && typeof metadata === "object") {
		const text = (metadata as any).text ?? (metadata as any).body;
		if (typeof text === "string" && text.trim()) return text;
	}
	return "";
};

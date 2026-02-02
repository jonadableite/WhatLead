import prisma from "@WhatLead/db";
import { randomUUID } from "crypto";
import { Conversation } from "../../domain/entities/conversation";
import type {
	ConversationTimelineEvent,
	MessageOrigin,
} from "../../domain/entities/conversation-timeline-event";
import { ConversationSLA } from "../../domain/value-objects/conversation-sla";
import { formatContactLabel } from "../../application/conversations/contact-utils";
import type {
	ConversationListResult,
	ConversationMessagesResult,
	ConversationRepository,
	ConversationTimelineResult,
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
			kind: ((row as any).kind ?? "PRIVATE") as any,
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
			kind: ((row as any).kind ?? "PRIVATE") as any,
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
			kind: ((row as any).kind ?? "PRIVATE") as any,
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
				kind: conversation.kind,
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
				kind: conversation.kind,
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
		type ConversationWhereInput = NonNullable<
			NonNullable<Parameters<typeof prisma.conversation.findMany>[0]>["where"]
		>;

		const assignmentFilters: ConversationWhereInput[] = params.operatorId
			? [
					{ assignedOperatorId: params.operatorId },
					...(params.includeUnassigned === false
						? []
						: [{ assignedOperatorId: null, assignedAgentId: null }]),
				]
			: [];

		const where: ConversationWhereInput = {
			tenantId: params.tenantId,
			instanceId: params.instanceId,
			...(params.status ? { status: params.status } : {}),
		};

		const andFilters: ConversationWhereInput[] = [];
		if (params.search) {
			andFilters.push({
				OR: [
					{
						contactId: {
							contains: params.search,
							mode: "insensitive",
						},
					},
					{
						lead: {
							name: {
								contains: params.search,
								mode: "insensitive",
							},
						},
					},
				],
			});
		}

		if (assignmentFilters.length > 0) {
			andFilters.push({ OR: assignmentFilters });
		}

		if (andFilters.length > 0) {
			where.AND = andFilters;
		}

		const [rows, total] = await Promise.all([
			prisma.conversation.findMany({
				where,
				orderBy: { lastMessageAt: "desc" },
				skip: params.offset,
				take: params.limit,
				include: {
					lead: true,
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
					profilePicUrl: (row.lead as any)?.profilePicUrl ?? null,
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
				media: resolveMessageMedia(row.metadata),
				occurredAt: row.occurredAt,
			}))
			.reverse();

		return {
			items,
			nextCursor: hasMore ? sliced[sliced.length - 1]?.id : undefined,
		};
	}

	async saveEvent(event: ConversationTimelineEvent & { conversationId: string }): Promise<void> {
		if (event.type === "MESSAGE") {
			return;
		}

		await prisma.conversationEvent.create({
			data: {
				id: randomUUID(),
				conversationId: event.conversationId,
				type: event.type,
				payload: resolveEventPayload(event),
				occurredAt: event.createdAt,
			},
		});
	}

	async findTimeline(params: {
		conversationId: string;
		limit: number;
		cursor?: string;
	}): Promise<ConversationTimelineResult> {
		const cursorDate = parseCursorDate(params.cursor);
		const limit = Math.min(Math.max(params.limit, 1), 200);

		const [messageRows, eventRows] = await Promise.all([
			prisma.message.findMany({
				where: {
					conversationId: params.conversationId,
					...(cursorDate ? { occurredAt: { lt: cursorDate } } : {}),
				},
				orderBy: { occurredAt: "desc" },
				take: limit + 1,
			}),
			prisma.conversationEvent.findMany({
				where: {
					conversationId: params.conversationId,
					...(cursorDate ? { occurredAt: { lt: cursorDate } } : {}),
				},
				orderBy: { occurredAt: "desc" },
				take: limit + 1,
			}),
		]);

		const timeline = [
			...messageRows.map((row) => mapMessageToTimelineEvent(row)),
			...eventRows.map((row) => mapStoredEvent(row)),
		].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

		const sliced = timeline.length > limit ? timeline.slice(-limit) : timeline;
		const nextCursor =
			timeline.length > limit ? sliced[0]?.createdAt.toISOString() : undefined;

		return {
			items: sliced,
			nextCursor,
		};
	}
}

const resolveMessageBody = (contentRef: string | null, metadata: unknown): string => {
	if (metadata && typeof metadata === "object") {
		const messageType = (metadata as any).messageType;
		const caption = (metadata as any).caption;
		if (typeof messageType === "string" && messageType !== "text") {
			const label = resolveMediaLabel(messageType);
			if (label && typeof caption === "string" && caption.trim()) {
				return `${label} ${caption.trim()}`;
			}
			if (label) return label;
		}
	}

	if (contentRef && String(contentRef).trim()) return String(contentRef);
	if (metadata && typeof metadata === "object") {
		const text = (metadata as any).text ?? (metadata as any).body ?? (metadata as any).caption;
		if (typeof text === "string" && text.trim()) return text;
	}
	return "";
};

const resolveMessageMedia = (
	metadata: unknown,
): { url?: string; base64?: string; mimeType?: string; caption?: string } | undefined => {
	if (!metadata || typeof metadata !== "object") return undefined;
	const messageType = (metadata as any).messageType;
	if (!messageType || messageType === "text") return undefined;

	const mediaUrl = (metadata as any).mediaUrl;
	const mediaBase64 = (metadata as any).mediaBase64;
	const mimeType = (metadata as any).mediaMimeType;
	const caption = (metadata as any).caption;

	if (!mediaUrl && !mediaBase64) return undefined;

	return {
		url: typeof mediaUrl === "string" ? mediaUrl : undefined,
		base64: typeof mediaBase64 === "string" ? mediaBase64 : undefined,
		mimeType: typeof mimeType === "string" ? mimeType : undefined,
		caption: typeof caption === "string" ? caption : undefined,
	};
};

const resolveMediaLabel = (messageType: string): string | null => {
	switch (messageType) {
		case "image":
			return "📷 Foto";
		case "video":
			return "🎬 Vídeo";
		case "audio":
			return "🎵 Áudio";
		case "document":
			return "📄 Documento";
		case "sticker":
			return "🧷 Sticker";
		default:
			return null;
	}
};

const mapMessageToTimelineEvent = (row: {
	id: string;
	direction: string;
	type: string;
	sentBy: string;
	contentRef: string | null;
	metadata: unknown;
	occurredAt: Date;
}): ConversationTimelineEvent => {
	const direction = row.direction as MessageDirection;
	const type = row.type as MessageType;
	const sentBy = row.sentBy as MessageSender;
	const metadata = row.metadata ?? {};

	return {
		type: "MESSAGE",
		messageId: row.id,
		direction,
		origin: inferMessageOrigin(metadata, sentBy, direction),
		payload: buildMessagePayload(type, row.contentRef, metadata),
		createdAt: row.occurredAt,
	};
};

const mapStoredEvent = (row: {
	type: string;
	payload: unknown;
	occurredAt: Date;
}): ConversationTimelineEvent => {
	if (row.type === "SYSTEM") {
		return {
			type: "SYSTEM",
			action: String((row.payload as any)?.action ?? "CONVERSATION_OPENED") as
				| "CONVERSATION_OPENED"
				| "CONVERSATION_CLOSED",
			createdAt: row.occurredAt,
		};
	}
	if (row.type === "ASSIGNMENT") {
		const assignedTo = (row.payload as any)?.assignedTo ?? { type: "OPERATOR", id: "" };
		return {
			type: "ASSIGNMENT",
			assignedTo: {
				type: assignedTo.type === "AI" ? "AI" : "OPERATOR",
				id: String(assignedTo.id ?? ""),
			},
			createdAt: row.occurredAt,
		};
	}
	if (row.type === "TAG") {
		return {
			type: "TAG",
			tag: String((row.payload as any)?.tag ?? ""),
			createdAt: row.occurredAt,
		};
	}

	return {
		type: "SYSTEM",
		action: "CONVERSATION_OPENED",
		createdAt: row.occurredAt,
	};
};

const resolveEventPayload = (event: ConversationTimelineEvent) => {
	if (event.type === "SYSTEM") {
		return { action: event.action };
	}
	if (event.type === "ASSIGNMENT") {
		return { assignedTo: event.assignedTo };
	}
	if (event.type === "TAG") {
		return { tag: event.tag };
	}
	return {};
};

const parseCursorDate = (cursor?: string): Date | null => {
	if (!cursor) return null;
	const parsed = new Date(cursor);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const inferMessageOrigin = (
	metadata: Record<string, unknown>,
	sentBy: MessageSender,
	direction: MessageDirection,
): MessageOrigin => {
	const origin = typeof metadata?.origin === "string" ? metadata.origin : "";
	const normalized = origin.toUpperCase();

	if (normalized.includes("AI")) return "AI";
	if (normalized.includes("AUTO") || normalized.includes("WARMUP")) return "AUTOMATION";
	if (normalized.includes("MANUAL") || normalized.includes("CHAT")) return "MANUAL";

	if (sentBy === "AGENT") return "AI";
	if (sentBy === "BOT") return "AUTOMATION";
	if (direction === "INBOUND") return "MANUAL";
	return "MANUAL";
};

const buildMessagePayload = (
	messageType: MessageType,
	contentRef: string | null,
	metadata: unknown,
): ConversationTimelineEvent["payload"] => {
	if (messageType === "REACTION") {
		return {
			kind: "REACTION",
			reaction: {
				emoji: String((metadata as any)?.emoji ?? ""),
				targetMessageId: (metadata as any)?.targetMessageId,
			},
		};
	}

	if (messageType === "AUDIO") {
		const media = resolveMessageMedia(metadata);
		return {
			kind: "AUDIO",
			audio: media
				? {
						url: media.url,
						base64: media.base64,
						mimeType: media.mimeType,
					}
				: undefined,
		};
	}

	if (messageType !== "TEXT") {
		return {
			kind: "MEDIA",
			media: resolveMessageMedia(metadata),
			text: resolveMessageBody(contentRef, metadata) || undefined,
		};
	}

	return {
		kind: "TEXT",
		text: resolveMessageBody(contentRef, metadata) || undefined,
	};
};

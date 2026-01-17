import prisma from "@WhatLead/db";
import { Conversation } from "../../domain/entities/conversation";
import { ConversationSLA } from "../../domain/value-objects/conversation-sla";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";

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
			status: row.status as any,
			stage: (row as any).stage as any,
			assignedAgentId: row.assignedAgentId ?? null,
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
			status: row.status as any,
			stage: (row as any).stage as any,
			assignedAgentId: row.assignedAgentId ?? null,
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
				status: conversation.status,
				stage: conversation.stage,
				isActive: conversation.isActive,
				assignedAgentId: conversation.assignedAgentId,
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
				status: conversation.status,
				stage: conversation.stage,
				isActive: conversation.isActive,
				assignedAgentId: conversation.assignedAgentId,
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
}

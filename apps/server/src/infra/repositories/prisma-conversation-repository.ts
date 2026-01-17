import prisma from "@WhatLead/db";
import { Conversation } from "../../domain/entities/conversation";
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
			assignedAgentId: row.assignedAgentId ?? null,
			openedAt: row.openedAt,
			lastMessageAt: row.lastMessageAt,
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
				isActive: conversation.isActive,
				assignedAgentId: conversation.assignedAgentId,
				openedAt: conversation.openedAt,
				lastMessageAt: conversation.lastMessageAt,
			},
			update: {
				status: conversation.status,
				isActive: conversation.isActive,
				assignedAgentId: conversation.assignedAgentId,
				lastMessageAt: conversation.lastMessageAt,
			},
		});
	}
}


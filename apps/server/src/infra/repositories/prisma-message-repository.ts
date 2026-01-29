import prisma from "@WhatLead/db";
import { Message } from "../../domain/entities/message";
import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { MessageDeliveryStatus } from "../../domain/value-objects/message-delivery-status";
import type { MessageDirection } from "../../domain/value-objects/message-direction";
import type { MessageSender } from "../../domain/value-objects/message-sender";
import type { MessageType } from "../../domain/value-objects/message-type";

type MessageRow = NonNullable<Awaited<ReturnType<typeof prisma.message.findFirst>>>;

const mapRowToMessage = (row: MessageRow): Message =>
	Message.reconstitute({
		id: row.id,
		conversationId: row.conversationId,
		direction: row.direction as MessageDirection,
		type: row.type as MessageType,
		sentBy: row.sentBy as MessageSender,
		status: row.status as MessageDeliveryStatus,
		providerMessageId: row.providerMessageId ?? undefined,
		contentRef: row.contentRef ?? undefined,
		metadata: (row.metadata ?? {}) as Record<string, unknown>,
		occurredAt: row.occurredAt,
	});

export class PrismaMessageRepository implements MessageRepository {
	async existsByProviderMessageId(params: {
		conversationId: string;
		providerMessageId: string;
	}): Promise<boolean> {
		const row = await prisma.message.findFirst({
			where: {
				conversationId: params.conversationId,
				providerMessageId: params.providerMessageId,
			},
			select: { id: true },
		});
		return Boolean(row);
	}

	async append(message: Message): Promise<void> {
		await prisma.message.create({
			data: {
				id: message.id,
				conversationId: message.conversationId,
				direction: message.direction,
				type: message.type,
				sentBy: message.sentBy,
				status: message.status,
				providerMessageId: message.providerMessageId,
				contentRef: message.contentRef,
				metadata: message.metadata as any,
				occurredAt: message.occurredAt,
			},
		});
	}

	async findLatestPendingOutbound(params: {
		conversationId: string;
	}): Promise<Message | null> {
		const row = await prisma.message.findFirst({
			where: {
				conversationId: params.conversationId,
				direction: "OUTBOUND",
				status: "PENDING",
			},
			orderBy: { occurredAt: "desc" },
		});
		if (!row) return null;
		return mapRowToMessage(row);
	}

	async updateDelivery(params: {
		messageId: string;
		status: MessageDeliveryStatus;
		providerMessageId?: string;
		occurredAt?: Date;
		contentRef?: string;
		metadata?: Record<string, unknown>;
	}): Promise<void> {
		await prisma.message.update({
			where: { id: params.messageId },
			data: {
				status: params.status,
				providerMessageId: params.providerMessageId ?? undefined,
				occurredAt: params.occurredAt ?? undefined,
				contentRef: params.contentRef ?? undefined,
				metadata: params.metadata as any,
			},
		});
	}
}


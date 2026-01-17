import prisma from "@WhatLead/db";
import type { Message } from "../../domain/entities/message";
import type { MessageRepository } from "../../domain/repositories/message-repository";

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
				providerMessageId: message.providerMessageId,
				contentRef: message.contentRef,
				metadata: message.metadata as any,
				occurredAt: message.occurredAt,
			},
		});
	}
}


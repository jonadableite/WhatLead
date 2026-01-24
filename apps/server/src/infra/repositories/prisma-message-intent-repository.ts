import prisma from "@WhatLead/db";

import { MessageIntent } from "../../domain/entities/message-intent";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";

export class PrismaMessageIntentRepository implements MessageIntentRepository {
	async create(intent: MessageIntent): Promise<void> {
		await prisma.messageIntent.create({
			data: {
				id: intent.id,
				organizationId: intent.organizationId,
				targetKind: intent.target.kind,
				targetValue: intent.target.value,
				intentType: intent.type,
				purpose: intent.purpose,
				payload: intent.payload as any,
				status: intent.status,
				decidedByInstanceId: intent.decidedByInstanceId,
				blockedReason: intent.blockedReason,
				queuedUntil: intent.queuedUntil,
				createdAt: intent.createdAt,
			},
		});
	}

	async findById(intentId: string): Promise<MessageIntent | null> {
		const row = await prisma.messageIntent.findUnique({ where: { id: intentId } });
		if (!row) return null;
		return MessageIntent.reconstitute({
			id: row.id,
			organizationId: row.organizationId,
			target: { kind: row.targetKind as any, value: row.targetValue },
			type: row.intentType as any,
			purpose: row.purpose as any,
			payload: row.payload as any,
			status: row.status as any,
			decidedByInstanceId: row.decidedByInstanceId,
			blockedReason: row.blockedReason as any,
			queuedUntil: row.queuedUntil,
			createdAt: row.createdAt,
		});
	}

	async save(intent: MessageIntent): Promise<void> {
		await prisma.messageIntent.upsert({
			where: { id: intent.id },
			create: {
				id: intent.id,
				organizationId: intent.organizationId,
				targetKind: intent.target.kind,
				targetValue: intent.target.value,
				intentType: intent.type,
				purpose: intent.purpose,
				payload: intent.payload as any,
				status: intent.status,
				decidedByInstanceId: intent.decidedByInstanceId,
				blockedReason: intent.blockedReason,
				queuedUntil: intent.queuedUntil,
				createdAt: intent.createdAt,
			},
			update: {
				status: intent.status,
				decidedByInstanceId: intent.decidedByInstanceId,
				blockedReason: intent.blockedReason,
				queuedUntil: intent.queuedUntil,
			},
		});
	}

	async listPendingByOrg(organizationId: string, limit: number): Promise<MessageIntent[]> {
		const rows = await prisma.messageIntent.findMany({
			where: { organizationId, status: { in: ["PENDING", "QUEUED"] } },
			orderBy: { createdAt: "asc" },
			take: limit,
		});

		return rows.map((row) =>
			MessageIntent.reconstitute({
				id: row.id,
				organizationId: row.organizationId,
				target: { kind: row.targetKind as any, value: row.targetValue },
				type: row.intentType as any,
				purpose: row.purpose as any,
				payload: row.payload as any,
				status: row.status as any,
				decidedByInstanceId: row.decidedByInstanceId,
				blockedReason: row.blockedReason as any,
				queuedUntil: row.queuedUntil,
				createdAt: row.createdAt,
			}),
		);
	}
}


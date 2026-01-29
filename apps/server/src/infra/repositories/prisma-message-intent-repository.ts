import prisma from "@WhatLead/db";

import { MessageIntent } from "../../domain/entities/message-intent";
import type {
	MessageIntentListFilters,
	MessageIntentRepository,
} from "../../domain/repositories/message-intent-repository";
import type { MessageGateDecisionReason } from "../../domain/value-objects/message-gate-decision-reason";
import type { MessageIntentOrigin } from "../../domain/value-objects/message-intent-origin";
import type { MessageIntentPayload } from "../../domain/value-objects/message-intent-payload";
import type { MessageIntentPurpose } from "../../domain/value-objects/message-intent-purpose";
import type { MessageIntentStatus } from "../../domain/value-objects/message-intent-status";
import type { MessageIntentType } from "../../domain/value-objects/message-intent-type";
import type { MessageTarget } from "../../domain/value-objects/message-target";

type MessageIntentRow = NonNullable<Awaited<ReturnType<typeof prisma.messageIntent.findUnique>>>;

const mapRowToIntent = (row: MessageIntentRow): MessageIntent =>
	MessageIntent.reconstitute({
		id: row.id,
		organizationId: row.organizationId,
		target: { kind: row.targetKind as MessageTarget["kind"], value: row.targetValue },
		type: row.intentType as MessageIntentType,
		purpose: row.purpose as MessageIntentPurpose,
		origin: row.origin as MessageIntentOrigin | null,
		payload: row.payload as unknown as MessageIntentPayload,
		status: row.status as MessageIntentStatus,
		decidedByInstanceId: row.decidedByInstanceId,
		blockedReason: row.blockedReason as MessageGateDecisionReason | null,
		queuedUntil: row.queuedUntil,
		createdAt: row.createdAt,
	});

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
				origin: intent.origin,
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
		return mapRowToIntent(row);
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
				origin: intent.origin,
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
				origin: intent.origin,
			},
		});
	}

	async listPendingByOrg(organizationId: string, limit: number): Promise<MessageIntent[]> {
		const rows = await prisma.messageIntent.findMany({
			where: { organizationId, status: { in: ["PENDING", "QUEUED"] } },
			orderBy: { createdAt: "asc" },
			take: limit,
		});

		return rows.map(mapRowToIntent);
	}

	async listApproved(limit: number): Promise<MessageIntent[]> {
		const rows = await prisma.messageIntent.findMany({
			where: { status: "APPROVED" },
			orderBy: { createdAt: "asc" },
			take: limit,
		});

		return rows.map(mapRowToIntent);
	}

	async listByFilters(filters: MessageIntentListFilters): Promise<MessageIntent[]> {
		const rows = await prisma.messageIntent.findMany({
			where: {
				organizationId: filters.organizationId,
				status: filters.status,
				purpose: filters.purpose,
				decidedByInstanceId: filters.instanceId,
			},
			orderBy: { createdAt: "desc" },
			take: filters.limit,
		});

		return rows.map(mapRowToIntent);
	}
}

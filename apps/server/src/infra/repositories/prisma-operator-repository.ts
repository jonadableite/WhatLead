import prisma from "@WhatLead/db";
import { Operator } from "../../domain/entities/operator";
import type { OperatorRepository } from "../../domain/repositories/operator-repository";
import type { OperatorStatus } from "../../domain/value-objects/operator-status";

export class PrismaOperatorRepository implements OperatorRepository {
	async findById(id: string): Promise<Operator | null> {
		const row = await prisma.operator.findUnique({ where: { id } });
		if (!row) return null;
		return mapRowToOperator(row);
	}

	async findByUserId(params: {
		organizationId: string;
		userId: string;
	}): Promise<Operator | null> {
		const row = await prisma.operator.findFirst({
			where: { organizationId: params.organizationId, userId: params.userId },
		});
		if (!row) return null;
		return mapRowToOperator(row);
	}

	async listAvailable(params: {
		organizationId: string;
		status?: OperatorStatus;
		limit: number;
	}): Promise<Operator[]> {
		const rows = await prisma.operator.findMany({
			where: {
				organizationId: params.organizationId,
				...(params.status ? { status: params.status } : {}),
			},
			orderBy: { updatedAt: "desc" },
			take: params.limit,
		});
		return rows.map(mapRowToOperator).filter((operator) => operator.isAvailable());
	}

	async recalculateConversationCount(params: { operatorId: string }): Promise<number> {
		return prisma.conversation.count({
			where: {
				assignedOperatorId: params.operatorId,
				status: "OPEN",
				isActive: true,
			},
		});
	}

	async create(operator: Operator): Promise<void> {
		await prisma.operator.create({
			data: {
				id: operator.id,
				organizationId: operator.organizationId,
				userId: operator.userId,
				name: operator.name,
				status: operator.status,
				maxConcurrentConversations: operator.maxConcurrentConversations,
				currentConversationCount: operator.currentConversationCount,
				createdAt: operator.createdAt,
			},
		});
	}

	async save(operator: Operator): Promise<void> {
		await prisma.operator.upsert({
			where: { id: operator.id },
			create: {
				id: operator.id,
				organizationId: operator.organizationId,
				userId: operator.userId,
				name: operator.name,
				status: operator.status,
				maxConcurrentConversations: operator.maxConcurrentConversations,
				currentConversationCount: operator.currentConversationCount,
				createdAt: operator.createdAt,
			},
			update: {
				name: operator.name,
				status: operator.status,
				maxConcurrentConversations: operator.maxConcurrentConversations,
				currentConversationCount: operator.currentConversationCount,
			},
		});
	}
}

const mapRowToOperator = (row: {
	id: string;
	organizationId: string;
	userId: string;
	name: string;
	status: string;
	maxConcurrentConversations: number;
	currentConversationCount: number;
	createdAt: Date;
}): Operator =>
	Operator.reconstitute({
		id: row.id,
		organizationId: row.organizationId,
		userId: row.userId,
		name: row.name,
		status: row.status as OperatorStatus,
		maxConcurrentConversations: row.maxConcurrentConversations,
		currentConversationCount: row.currentConversationCount,
		createdAt: row.createdAt,
	});

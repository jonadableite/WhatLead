import prisma from "@WhatLead/db";

import { ExecutionControl } from "../../domain/entities/execution-control";
import type { ExecutionControlRepository } from "../../domain/repositories/execution-control-repository";
import type { ExecutionControlScope } from "../../domain/value-objects/execution-control-scope";

export class PrismaExecutionControlRepository implements ExecutionControlRepository {
	async findByScope(scope: ExecutionControlScope, scopeId: string): Promise<ExecutionControl | null> {
		const row = await prisma.executionControl.findUnique({
			where: { scope_scopeId: { scope, scopeId } },
		});
		if (!row) return null;
		return ExecutionControl.reconstitute({
			id: row.id,
			scope: row.scope as any,
			scopeId: row.scopeId,
			status: row.status as any,
			reason: row.reason,
			pausedUntil: row.pausedUntil,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		});
	}

	async upsert(control: ExecutionControl): Promise<void> {
		await prisma.executionControl.upsert({
			where: { scope_scopeId: { scope: control.scope, scopeId: control.scopeId } },
			create: {
				id: control.id,
				scope: control.scope,
				scopeId: control.scopeId,
				status: control.status,
				reason: control.reason,
				pausedUntil: control.pausedUntil,
				createdAt: control.createdAt,
			},
			update: {
				status: control.status,
				reason: control.reason,
				pausedUntil: control.pausedUntil,
			},
		});
	}
}


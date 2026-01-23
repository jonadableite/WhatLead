import prisma from "@WhatLead/db";

import type { ActiveInstanceIdsProvider } from "../../application/ports/active-instance-ids-provider";

export class PrismaActiveInstanceIdsProvider implements ActiveInstanceIdsProvider {
	async list(): Promise<string[]> {
		const rows = await prisma.instance.findMany({ select: { id: true } });
		return rows.map((r) => r.id);
	}
}


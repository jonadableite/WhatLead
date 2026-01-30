import prisma from "@WhatLead/db";
import { Lead } from "../../domain/entities/lead";
import type { LeadRepository } from "../../domain/repositories/lead-repository";

export class PrismaLeadRepository implements LeadRepository {
	async findById(params: { id: string }): Promise<Lead | null> {
		const row = await prisma.lead.findUnique({ where: { id: params.id } });
		if (!row) return null;

		return Lead.reconstitute({
			id: row.id,
			tenantId: row.tenantId,
			campaignId: row.campaignId ?? null,
			name: row.name,
			email: row.email,
			phone: row.phone,
			profilePicUrl: (row as any).profilePicUrl ?? null,
			lid: (row as any).lid ?? null,
			stage: row.stage as any,
			createdAt: row.createdAt,
		});
	}

	async findByPhone(params: { tenantId: string; phone: string }): Promise<Lead | null> {
		const phone = params.phone.trim();
		if (!phone) return null;
		const row = await prisma.lead.findFirst({
			where: { tenantId: params.tenantId, phone },
		});
		if (!row) return null;
		return Lead.reconstitute({
			id: row.id,
			tenantId: row.tenantId,
			campaignId: row.campaignId ?? null,
			name: row.name,
			email: row.email,
			phone: row.phone,
			profilePicUrl: (row as any).profilePicUrl ?? null,
			lid: (row as any).lid ?? null,
			stage: row.stage as any,
			createdAt: row.createdAt,
		});
	}

	async findByLid(params: { tenantId: string; lid: string }): Promise<Lead | null> {
		const lid = params.lid.trim();
		if (!lid) return null;
		const row = await prisma.lead.findFirst({
			where: { tenantId: params.tenantId, lid },
		});
		if (!row) return null;
		return Lead.reconstitute({
			id: row.id,
			tenantId: row.tenantId,
			campaignId: row.campaignId ?? null,
			name: row.name,
			email: row.email,
			phone: row.phone,
			profilePicUrl: (row as any).profilePicUrl ?? null,
			lid: (row as any).lid ?? null,
			stage: row.stage as any,
			createdAt: row.createdAt,
		});
	}

	async save(lead: Lead): Promise<void> {
		await prisma.lead.upsert({
			where: { id: lead.id },
			create: {
				id: lead.id,
				tenantId: lead.tenantId,
				campaignId: lead.campaignId,
				name: lead.name,
				email: lead.email,
				phone: lead.phone,
				profilePicUrl: lead.profilePicUrl,
				lid: lead.lid,
				stage: lead.stage,
				createdAt: lead.createdAt,
			},
			update: {
				name: lead.name,
				email: lead.email,
				phone: lead.phone,
				profilePicUrl: lead.profilePicUrl,
				lid: lead.lid,
				stage: lead.stage,
			},
		});
	}
}


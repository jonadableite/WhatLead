import { Lead } from "../../domain/entities/lead";
import type { LeadRepository } from "../../domain/repositories/lead-repository";

export class CreateLeadUseCase {
	constructor(
		private readonly leads: LeadRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(params: {
		tenantId: string;
		campaignId?: string | null;
		name: string;
		email: string;
		phone: string;
		now?: Date;
	}): Promise<Lead> {
		const lead = Lead.create({
			id: this.idFactory.createId(),
			tenantId: params.tenantId,
			campaignId: params.campaignId ?? null,
			name: params.name,
			email: params.email,
			phone: params.phone,
			stage: "NEW",
			createdAt: params.now,
		});

		await this.leads.save(lead);
		return lead;
	}
}


import type { Lead } from "../../domain/entities/lead";
import type { LeadRepository } from "../../domain/repositories/lead-repository";

export class InMemoryLeadRepository implements LeadRepository {
	private readonly byId = new Map<string, Lead>();

	constructor(initial: readonly Lead[] = []) {
		for (const lead of initial) {
			this.byId.set(lead.id, lead);
		}
	}

	async findById(params: { id: string }): Promise<Lead | null> {
		return this.byId.get(params.id) ?? null;
	}

	async findByPhone(params: { tenantId: string; phone: string }): Promise<Lead | null> {
		const phone = params.phone.trim();
		if (!phone) return null;
		for (const lead of this.byId.values()) {
			if (lead.tenantId === params.tenantId && lead.phone === phone) {
				return lead;
			}
		}
		return null;
	}

	async findByLid(params: { tenantId: string; lid: string }): Promise<Lead | null> {
		const lid = params.lid.trim();
		if (!lid) return null;
		for (const lead of this.byId.values()) {
			if (lead.tenantId === params.tenantId && lead.lid === lid) {
				return lead;
			}
		}
		return null;
	}

	async save(lead: Lead): Promise<void> {
		this.byId.set(lead.id, lead);
	}
}


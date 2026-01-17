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

	async save(lead: Lead): Promise<void> {
		this.byId.set(lead.id, lead);
	}
}


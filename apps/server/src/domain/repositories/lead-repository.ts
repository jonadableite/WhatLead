import type { Lead } from "../entities/lead";

export interface LeadRepository {
	findById(params: { id: string }): Promise<Lead | null>;
	save(lead: Lead): Promise<void>;
}


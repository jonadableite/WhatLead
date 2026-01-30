import type { Lead } from "../entities/lead";

export interface LeadRepository {
	findById(params: { id: string }): Promise<Lead | null>;
	findByPhone(params: { tenantId: string; phone: string }): Promise<Lead | null>;
	findByLid(params: { tenantId: string; lid: string }): Promise<Lead | null>;
	save(lead: Lead): Promise<void>;
}


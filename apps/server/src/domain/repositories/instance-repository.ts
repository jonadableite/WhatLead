import type { Instance } from "../entities/instance";

export interface InstanceRepository {
	create(instance: Instance): Promise<void>;
	findById(instanceId: string): Promise<Instance | null>;
	listByCompanyId(companyId: string): Promise<Instance[]>;
	save(instance: Instance): Promise<void>;
	delete(instanceId: string): Promise<void>;
}


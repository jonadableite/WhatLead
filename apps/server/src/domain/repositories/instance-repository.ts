import type { Instance } from "../entities/instance";

export interface InstanceRepository {
	findById(instanceId: string): Promise<Instance | null>;
	save(instance: Instance): Promise<void>;
}


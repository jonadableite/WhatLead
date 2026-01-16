import type { InstanceReputation } from "../entities/instance-reputation";

export interface InstanceReputationRepository {
	findByInstanceId(instanceId: string): Promise<InstanceReputation | null>;
	save(reputation: InstanceReputation): Promise<void>;
}

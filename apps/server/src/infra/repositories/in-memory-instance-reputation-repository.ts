import type { InstanceReputationRepository } from "../../domain/repositories/instance-reputation-repository";
import type { InstanceReputation } from "../../domain/entities/instance-reputation";

export class InMemoryInstanceReputationRepository
	implements InstanceReputationRepository
{
	private readonly store = new Map<string, InstanceReputation>();

	async findByInstanceId(instanceId: string): Promise<InstanceReputation | null> {
		return this.store.get(instanceId) ?? null;
	}

	async save(reputation: InstanceReputation): Promise<void> {
		this.store.set(reputation.instanceId, reputation);
	}
}


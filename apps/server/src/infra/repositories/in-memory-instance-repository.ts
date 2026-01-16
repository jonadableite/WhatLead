import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { WhatsAppEngine } from "../../domain/value-objects/whatsapp-engine";

export class InMemoryInstanceRepository implements InstanceRepository {
	private readonly store = new Map<string, Instance>();

	constructor(
		private readonly defaultCompanyId: string,
		private readonly defaultEngine: WhatsAppEngine,
	) {}

	async findById(instanceId: string): Promise<Instance | null> {
		const existing = this.store.get(instanceId);
		if (existing) {
			return existing;
		}

		const created = Instance.initialize({
			id: instanceId,
			companyId: this.defaultCompanyId,
			engine: this.defaultEngine,
			reputation: InstanceReputation.initialize(instanceId),
		});

		this.store.set(instanceId, created);
		return created;
	}

	async save(instance: Instance): Promise<void> {
		this.store.set(instance.id, instance);
	}

	listIds(): string[] {
		return [...this.store.keys()];
	}
}


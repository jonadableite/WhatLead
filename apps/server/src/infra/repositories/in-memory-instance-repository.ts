import { Instance } from "../../domain/entities/instance";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";

export class InMemoryInstanceRepository implements InstanceRepository {
	private readonly store = new Map<string, Instance>();

	async create(instance: Instance): Promise<void> {
		this.store.set(instance.id, instance);
	}

	async findById(instanceId: string): Promise<Instance | null> {
		return this.store.get(instanceId) ?? null;
	}

	async listByCompanyId(companyId: string): Promise<Instance[]> {
		return [...this.store.values()].filter((i) => i.companyId === companyId);
	}

	async save(instance: Instance): Promise<void> {
		this.store.set(instance.id, instance);
	}

	async delete(instanceId: string): Promise<void> {
		this.store.delete(instanceId);
	}

	listIds(): string[] {
		return [...this.store.keys()];
	}
}


import type { ActiveInstanceIdsProvider } from "../../application/ports/active-instance-ids-provider";
import { InMemoryInstanceRepository } from "../repositories/in-memory-instance-repository";

export class InMemoryActiveInstanceIdsProvider implements ActiveInstanceIdsProvider {
	constructor(private readonly instanceRepository: InMemoryInstanceRepository) {}

	async list(): Promise<string[]> {
		return this.instanceRepository.listIds();
	}
}


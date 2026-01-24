import type { MessageIntent } from "../../domain/entities/message-intent";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";

export class InMemoryMessageIntentRepository implements MessageIntentRepository {
	private readonly store = new Map<string, MessageIntent>();

	async create(intent: MessageIntent): Promise<void> {
		this.store.set(intent.id, intent);
	}

	async findById(intentId: string): Promise<MessageIntent | null> {
		return this.store.get(intentId) ?? null;
	}

	async save(intent: MessageIntent): Promise<void> {
		this.store.set(intent.id, intent);
	}

	async listPendingByOrg(organizationId: string, limit: number): Promise<MessageIntent[]> {
		const pending = [...this.store.values()].filter((i) => i.organizationId === organizationId);
		return pending.slice(0, limit);
	}

	async listApproved(limit: number): Promise<MessageIntent[]> {
		const approved = [...this.store.values()].filter((i) => i.status === "APPROVED");
		return approved.slice(0, limit);
	}
}

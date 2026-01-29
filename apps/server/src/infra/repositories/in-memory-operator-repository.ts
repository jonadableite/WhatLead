import type { Operator } from "../../domain/entities/operator";
import type { OperatorRepository } from "../../domain/repositories/operator-repository";
import type { OperatorStatus } from "../../domain/value-objects/operator-status";

export class InMemoryOperatorRepository implements OperatorRepository {
	private readonly byId = new Map<string, Operator>();

	async findById(id: string): Promise<Operator | null> {
		return this.byId.get(id) ?? null;
	}

	async findByUserId(params: {
		organizationId: string;
		userId: string;
	}): Promise<Operator | null> {
		for (const operator of this.byId.values()) {
			if (
				operator.organizationId === params.organizationId &&
				operator.userId === params.userId
			) {
				return operator;
			}
		}
		return null;
	}

	async listAvailable(params: {
		organizationId: string;
		status?: OperatorStatus;
		limit: number;
	}): Promise<Operator[]> {
		const list = Array.from(this.byId.values()).filter(
			(operator) =>
				operator.organizationId === params.organizationId &&
				(!params.status || operator.status === params.status),
		);

		return list.filter((operator) => operator.isAvailable()).slice(0, params.limit);
	}

	async recalculateConversationCount(params: { operatorId: string }): Promise<number> {
		const operator = this.byId.get(params.operatorId);
		return operator?.currentConversationCount ?? 0;
	}

	async create(operator: Operator): Promise<void> {
		this.byId.set(operator.id, operator);
	}

	async save(operator: Operator): Promise<void> {
		this.byId.set(operator.id, operator);
	}
}

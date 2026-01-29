import type { Operator } from "../entities/operator";
import type { OperatorStatus } from "../value-objects/operator-status";

export interface OperatorRepository {
	findById(id: string): Promise<Operator | null>;
	findByUserId(params: { organizationId: string; userId: string }): Promise<Operator | null>;
	listAvailable(params: {
		organizationId: string;
		status?: OperatorStatus;
		limit: number;
	}): Promise<Operator[]>;
	recalculateConversationCount(params: { operatorId: string }): Promise<number>;
	create(operator: Operator): Promise<void>;
	save(operator: Operator): Promise<void>;
}

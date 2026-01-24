import type {
	OperationalEventRecord,
	OperationalEventRepository,
} from "../../domain/repositories/operational-event-repository";

export class InMemoryOperationalEventRepository implements OperationalEventRepository {
	private readonly events: OperationalEventRecord[] = [];

	async appendMany(records: OperationalEventRecord[]): Promise<void> {
		this.events.push(...records);
	}

	async listByAggregate(params: {
		organizationId?: string;
		aggregateType: string;
		aggregateId: string;
		limit: number;
	}): Promise<OperationalEventRecord[]> {
		return this.events
			.filter((e) => e.aggregateType === params.aggregateType && e.aggregateId === params.aggregateId)
			.filter((e) => (params.organizationId ? e.organizationId === params.organizationId : true))
			.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
			.slice(0, params.limit);
	}
}


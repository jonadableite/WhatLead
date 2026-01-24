export interface OperationalEventRecord {
	id: string;
	organizationId: string | null;
	aggregateType: string;
	aggregateId: string;
	eventType: string;
	payload: unknown;
	occurredAt: Date;
	createdAt: Date;
}

export interface OperationalEventRepository {
	appendMany(records: OperationalEventRecord[]): Promise<void>;
	listByAggregate(params: {
		organizationId?: string;
		aggregateType: string;
		aggregateId: string;
		limit: number;
	}): Promise<OperationalEventRecord[]>;
}


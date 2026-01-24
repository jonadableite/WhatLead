import type {
	ExecutionMetricsQueryPort,
	ExecutionMetricsSnapshot,
} from "./execution-metrics-query-port";

export interface GetExecutionMetricsUseCaseRequest {
	organizationId?: string;
	instanceId?: string;
	windowMinutes?: number;
	now?: Date;
}

export class GetExecutionMetricsUseCase {
	static readonly DEFAULT_WINDOW_MINUTES = 60;

	constructor(private readonly query: ExecutionMetricsQueryPort) {}

	async execute(request: GetExecutionMetricsUseCaseRequest): Promise<ExecutionMetricsSnapshot> {
		const now = request.now ?? new Date();
		const windowMinutes = request.windowMinutes ?? GetExecutionMetricsUseCase.DEFAULT_WINDOW_MINUTES;
		return this.query.getMetrics({
			organizationId: request.organizationId,
			instanceId: request.instanceId,
			windowMinutes,
			now,
		});
	}
}


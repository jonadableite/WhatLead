export interface ExecutionMetricsWindow {
	windowMinutes: number;
	now: Date;
}

export interface InstanceExecutionMetrics {
	instanceId: string;
	jobsCreated: number;
	messagesSent: number;
	failedJobs: number;
	retries: number;
	avgIntervalSeconds: number | null;
}

export interface ExecutionMetricsSnapshot {
	windowMinutes: number;
	since: Date;
	now: Date;
	totals: {
		jobsCreated: number;
		messagesSent: number;
		failedJobs: number;
		retries: number;
	};
	byInstance: InstanceExecutionMetrics[];
}

export interface ExecutionMetricsQueryPort {
	getMetrics(params: ExecutionMetricsWindow & { organizationId?: string; instanceId?: string }): Promise<ExecutionMetricsSnapshot>;
}


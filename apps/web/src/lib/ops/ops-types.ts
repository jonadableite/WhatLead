export interface ExecutionMetricsTotals {
	jobsCreated: number;
	messagesSent: number;
	failedJobs: number;
	retries: number;
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
	since: string;
	now: string;
	totals: ExecutionMetricsTotals;
	byInstance: InstanceExecutionMetrics[];
}

export interface MessageIntentTimelineIntent {
	id: string;
	organizationId: string;
	status: string;
	purpose: string;
	type: string;
	target: {
		kind: string;
		value: string;
	};
	decidedByInstanceId: string | null;
	blockedReason: string | null;
	queuedUntil: string | null;
	createdAt: string;
}

export interface MessageIntentTimelineJob {
	id: string;
	instanceId: string;
	provider: string;
	status: string;
	attempts: number;
	lastError: string | null;
	createdAt: string;
	executedAt: string | null;
	nextAttemptAt: string | null;
}

export interface OperationalEventRecord {
	id: string;
	organizationId: string | null;
	aggregateType: string;
	aggregateId: string;
	eventType: string;
	payload: unknown;
	occurredAt: string;
	createdAt: string;
}

export interface MessageIntentTimelineResponse {
	intent: MessageIntentTimelineIntent;
	job: MessageIntentTimelineJob | null;
	events: OperationalEventRecord[];
}

export type ExecutionJobStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "RETRY";

export interface ExecutionJobListItem {
	id: string;
	intentId: string;
	instanceId: string;
	provider: string;
	status: ExecutionJobStatus;
	attempts: number;
	lastError: string | null;
	createdAt: string;
	executedAt: string | null;
	nextAttemptAt: string | null;
}

export interface ExecutionJobsResponse {
	items: ExecutionJobListItem[];
}

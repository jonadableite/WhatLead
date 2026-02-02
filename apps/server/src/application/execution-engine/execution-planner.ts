import type { Conversation } from "../../domain/entities/conversation";
import { ConversationExecutionJob } from "../../domain/entities/conversation-execution-job";
import type { ConversationTimelineEvent } from "../../domain/entities/conversation-timeline-event";
import type { ExecutionJobType } from "../../domain/value-objects/execution-job-type";

export interface ExecutionPlannerConfig {
	slaTimeoutMs: number;
	assignmentEvaluationDelayMs: number;
	autoCloseDelayMs: number;
	webhookEnabled: boolean;
}

const DEFAULT_CONFIG: ExecutionPlannerConfig = {
	slaTimeoutMs: 10 * 60 * 1000, // 10 minutes
	assignmentEvaluationDelayMs: 5 * 60 * 1000, // 5 minutes
	autoCloseDelayMs: 24 * 60 * 60 * 1000, // 24 hours
	webhookEnabled: false,
};

export interface PlannedJob {
	type: ExecutionJobType;
	scheduledFor: Date;
	payload?: Record<string, unknown>;
	maxAttempts?: number;
}

export interface ExecutionPlanner {
	plan(
		event: ConversationTimelineEvent & { id: string },
		conversation: Conversation,
	): PlannedJob[];
}

export class DefaultExecutionPlanner implements ExecutionPlanner {
	private readonly config: ExecutionPlannerConfig;

	constructor(config: Partial<ExecutionPlannerConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	plan(
		event: ConversationTimelineEvent & { id: string },
		conversation: Conversation,
	): PlannedJob[] {
		const jobs: PlannedJob[] = [];
		const now = event.createdAt;

		if (event.type === "MESSAGE" && event.direction === "INBOUND") {
			// INBOUND message always triggers warmup check
			jobs.push({
				type: "WARMUP_CHECK",
				scheduledFor: now,
				maxAttempts: 1,
			});

			// INBOUND message on OPEN conversation triggers SLA timeout
			if (conversation.status === "OPEN") {
				jobs.push({
					type: "SLA_TIMEOUT",
					scheduledFor: new Date(now.getTime() + this.config.slaTimeoutMs),
					payload: {
						triggerMessageId: event.messageId,
						slaDeadline: new Date(now.getTime() + this.config.slaTimeoutMs).toISOString(),
					},
					maxAttempts: 1,
				});
			}
		}

		if (event.type === "ASSIGNMENT") {
			// Assignment triggers evaluation after delay
			jobs.push({
				type: "ASSIGNMENT_EVALUATION",
				scheduledFor: new Date(now.getTime() + this.config.assignmentEvaluationDelayMs),
				payload: {
					assignedTo: event.assignedTo,
				},
				maxAttempts: 3,
			});
		}

		if (event.type === "SYSTEM" && event.action === "CONVERSATION_CLOSED") {
			// Conversation closed triggers auto-close cleanup
			jobs.push({
				type: "AUTO_CLOSE_CONVERSATION",
				scheduledFor: new Date(now.getTime() + this.config.autoCloseDelayMs),
				maxAttempts: 1,
			});
		}

		// Webhook dispatch for all events if enabled
		if (this.config.webhookEnabled) {
			jobs.push({
				type: "WEBHOOK_DISPATCH",
				scheduledFor: now,
				payload: {
					eventType: event.type,
					eventId: event.id,
				},
				maxAttempts: 5,
			});
		}

		return jobs;
	}
}

export function createExecutionJobs(params: {
	plannedJobs: PlannedJob[];
	conversationId: string;
	triggerEventId: string;
	idFactory: { createId(): string };
}): ConversationExecutionJob[] {
	return params.plannedJobs.map((planned) =>
		ConversationExecutionJob.create({
			id: params.idFactory.createId(),
			conversationId: params.conversationId,
			triggerEventId: params.triggerEventId,
			type: planned.type,
			scheduledFor: planned.scheduledFor,
			payload: planned.payload,
			maxAttempts: planned.maxAttempts,
		}),
	);
}

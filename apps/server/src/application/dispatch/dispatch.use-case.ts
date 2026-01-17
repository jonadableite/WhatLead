import type { EvaluateInstanceHealthUseCase } from "../../domain/use-cases/evaluate-instance-health";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { DispatchPolicy } from "../../domain/services/dispatch-policy";
import type { DispatchDecision } from "../../domain/value-objects/dispatch-decision";
import type { GetReputationTimelineUseCase } from "../use-cases/get-reputation-timeline.use-case";
import type { MetricIngestionPort } from "../ports/metric-ingestion-port";
import {
	messageTypeOf,
	type DispatchExecutionResult,
	type DispatchRequest,
	type MessageDispatchPort,
} from "./dispatch-types";

export class DispatchUseCase {
	constructor(
		private readonly instanceRepository: InstanceRepository,
		private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase,
		private readonly dispatchPolicy: DispatchPolicy,
		private readonly dispatchPort: MessageDispatchPort,
		private readonly metricIngestion: MetricIngestionPort,
		private readonly timeline: GetReputationTimelineUseCase,
		private readonly outboundRecorder?: {
			execute: (event: import("../event-handlers/webhook-event-handler").NormalizedWhatsAppEvent) => Promise<void>;
		},
	) {}

	async execute(request: DispatchRequest): Promise<DispatchExecutionResult> {
		const now = request.now ?? new Date();

		const instance = await this.instanceRepository.findById(request.instanceId);
		if (!instance) {
			const decision: DispatchDecision = {
				allowed: false,
				reason: "INSTANCE_NOT_ACTIVE",
				maxMessages: 0,
				minIntervalSeconds: 0,
				allowedMessageTypes: [],
			};
			return { decision, result: { status: "BLOCKED", reason: "NO_INSTANCE" } };
		}

		const health = await this.evaluateInstanceHealth.execute({
			instanceId: request.instanceId,
			reason: "PRE_DISPATCH",
			now,
		});

		if (health.actions.includes("ENTER_COOLDOWN") || !health.actions.includes("ALLOW_DISPATCH")) {
			const decision: DispatchDecision = {
				allowed: false,
				reason: "COOLDOWN",
				maxMessages: 0,
				minIntervalSeconds: 0,
				allowedMessageTypes: [],
			};
			return { decision, result: { status: "BLOCKED", reason: "HEALTH_BLOCK" } };
		}

		const decision = this.dispatchPolicy.evaluate({
			instance,
			reputation: instance.reputation,
			intentSource: request.intent.source,
			messageType: messageTypeOf(request.message),
			now,
		});

		if (!decision.allowed) {
			return { decision, result: { status: "BLOCKED", reason: decision.reason } };
		}

		const allowedBudget = await this.checkBudget({
			instanceId: request.instanceId,
			now,
			maxMessagesPerHour: decision.maxMessages,
			minIntervalSeconds: decision.minIntervalSeconds,
		});

		if (!allowedBudget.allowed) {
			const blocked: DispatchDecision = {
				allowed: false,
				reason: allowedBudget.reason,
				maxMessages: 0,
				minIntervalSeconds: decision.minIntervalSeconds,
				allowedMessageTypes: decision.allowedMessageTypes,
			};
			return { decision: blocked, result: { status: "BLOCKED", reason: allowedBudget.reason } };
		}

		const sendResult = await this.dispatchPort.send({
			instanceId: request.instanceId,
			message: request.message,
			now,
		});

		if (sendResult.producedEvents && sendResult.producedEvents.length > 0) {
			await this.metricIngestion.recordMany(sendResult.producedEvents);
			if (this.outboundRecorder) {
				for (const e of sendResult.producedEvents) {
					if (e.type === "MESSAGE_SENT") {
						await this.outboundRecorder.execute(e);
					}
				}
			}
		}

		if (!sendResult.success) {
			return {
				decision,
				result: { status: "FAILED", error: sendResult.error ?? "DISPATCH_FAILED" },
			};
		}

		return {
			decision,
			result: { status: "SENT", messageId: sendResult.messageId, occurredAt: sendResult.occurredAt },
		};
	}

	private async checkBudget(params: {
		instanceId: string;
		now: Date;
		maxMessagesPerHour: number;
		minIntervalSeconds: number;
	}): Promise<{ allowed: true } | { allowed: false; reason: "RATE_LIMIT" }> {
		const since = new Date(params.now.getTime() - 60 * 60 * 1000);
		const signals = await this.timeline.execute({
			instanceId: params.instanceId,
			since,
			until: params.now,
		});

		const recentDispatch = signals
			.filter((s) => s.source === "DISPATCH" && s.type === "MESSAGE_SENT")
			.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

		if (recentDispatch.length >= params.maxMessagesPerHour) {
			return { allowed: false, reason: "RATE_LIMIT" };
		}

		const last = recentDispatch[0];
		if (last) {
			const diff = params.now.getTime() - last.occurredAt.getTime();
			if (diff < params.minIntervalSeconds * 1000) {
				return { allowed: false, reason: "RATE_LIMIT" };
			}
		}

		return { allowed: true };
	}
}

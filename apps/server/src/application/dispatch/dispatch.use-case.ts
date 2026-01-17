import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { DispatchDecision } from "../../domain/value-objects/dispatch-decision";
import type { MetricIngestionPort } from "../ports/metric-ingestion-port";
import {
	type DispatchExecutionResult,
	type DispatchRequest,
	type MessageDispatchPort,
} from "./dispatch-types";
import type { DispatchGateUseCase } from "../dispatch-gate/dispatch-gate.use-case";

export class DispatchUseCase {
	constructor(
		private readonly instanceRepository: InstanceRepository,
		private readonly gate: DispatchGateUseCase,
		private readonly dispatchPort: MessageDispatchPort,
		private readonly metricIngestion: MetricIngestionPort,
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

		const gateDecision = await this.gate.execute({
			instanceId: request.instanceId,
			conversationId: request.conversationId,
			type: request.intent.source === "WARMUP" ? "WARMUP" : "REPLY",
			payload: request.message,
			reason: request.intent.source === "HUMAN" ? "OPERATOR" : request.intent.source === "AGENT" ? "AGENT" : "SYSTEM",
			now,
		});

		if (!gateDecision.allowed) {
			const decision: DispatchDecision = {
				allowed: false,
				reason: gateDecision.reason,
				maxMessages: 0,
				minIntervalSeconds: 0,
				allowedMessageTypes: [],
			};
			return { decision, result: { status: "BLOCKED", reason: gateDecision.reason } };
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
				decision: {
					allowed: true,
					maxMessages: 0,
					minIntervalSeconds: 0,
					allowedMessageTypes: [],
				},
				result: { status: "FAILED", error: sendResult.error ?? "DISPATCH_FAILED" },
			};
		}

		return {
			decision: {
				allowed: true,
				maxMessages: 0,
				minIntervalSeconds: 0,
				allowedMessageTypes: [],
			},
			result: { status: "SENT", messageId: sendResult.messageId, occurredAt: sendResult.occurredAt },
		};
	}
}

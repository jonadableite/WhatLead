import type { DispatchMessageIntentGateUseCase } from "../message-dispatch/dispatch-message-intent-gate.use-case";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { MessageIntentStatus } from "../../domain/value-objects/message-intent-status";
import type { MessageGateDecisionReason } from "../../domain/value-objects/message-gate-decision-reason";

export interface DecideMessageIntentUseCaseRequest {
	intentId: string;
	organizationId: string;
	now?: Date;
}

export interface DecideMessageIntentUseCaseResponse {
	intentId: string;
	status: MessageIntentStatus;
	decision:
		| { kind: "APPROVED"; instanceId: string }
		| { kind: "QUEUED"; queuedUntil: Date; reason: MessageGateDecisionReason }
		| { kind: "BLOCKED"; reason: MessageGateDecisionReason };
}

export class DecideMessageIntentUseCase {
	constructor(
		private readonly intents: MessageIntentRepository,
		private readonly gate: DispatchMessageIntentGateUseCase,
	) {}

	async execute(
		request: DecideMessageIntentUseCaseRequest,
	): Promise<DecideMessageIntentUseCaseResponse> {
		const decision = await this.gate.execute({
			intentId: request.intentId,
			organizationId: request.organizationId,
			now: request.now,
		});

		const intent = await this.intents.findById(request.intentId);
		if (!intent) throw new Error("MESSAGE_INTENT_NOT_FOUND");

		if (decision.decision === "APPROVED") {
			return {
				intentId: intent.id,
				status: intent.status,
				decision: { kind: "APPROVED", instanceId: decision.instanceId },
			};
		}

		if (decision.decision === "QUEUED") {
			return {
				intentId: intent.id,
				status: intent.status,
				decision: {
					kind: "QUEUED",
					queuedUntil: decision.queuedUntil,
					reason: decision.reason,
				},
			};
		}

		return {
			intentId: intent.id,
			status: intent.status,
			decision: { kind: "BLOCKED", reason: decision.reason },
		};
	}
}


import type { Conversation } from "../entities/conversation";
import type { SLAStatus } from "../value-objects/sla-status";

export class SLAEvaluator {
	constructor(private readonly dueSoonWindowMs: number = 5 * 60 * 1000) {}

	evaluate(conversation: Conversation, now: Date): SLAStatus {
		if (!conversation.isActive) {
			return "OK";
		}

		const sla = conversation.sla;
		if (!sla) {
			return "OK";
		}

		const dueAt = sla.nextResponseDueAt ?? sla.firstResponseDueAt;
		if (!dueAt) {
			return "OK";
		}

		const diff = dueAt.getTime() - now.getTime();
		if (diff < 0) {
			return "BREACHED";
		}

		if (diff <= this.dueSoonWindowMs) {
			return "DUE_SOON";
		}

		return "OK";
	}
}


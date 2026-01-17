import type { GetReputationTimelineUseCase } from "../use-cases/get-reputation-timeline.use-case";

export class WarmupLimiter {
	constructor(private readonly timeline: GetReputationTimelineUseCase) {}

	async getBudget(params: {
		instanceId: string;
		now: Date;
		maxMessagesPerHour: number;
	}): Promise<{
		usedMessageLikeInLastHour: number;
		remainingMessageLikeInLastHour: number;
	}> {
		const since = new Date(params.now.getTime() - 60 * 60 * 1000);
		const signals = await this.timeline.execute({
			instanceId: params.instanceId,
			since,
			until: params.now,
		});

		const used = signals.filter(
			(s) =>
				s.source === "DISPATCH" &&
				(s.type === "MESSAGE_SENT" || s.type === "REACTION_SENT"),
		).length;

		const remaining = Math.max(0, params.maxMessagesPerHour - used);

		return {
			usedMessageLikeInLastHour: used,
			remainingMessageLikeInLastHour: remaining,
		};
	}
}


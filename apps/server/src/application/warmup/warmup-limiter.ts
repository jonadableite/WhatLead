import type { DispatchRateSnapshotPort } from "../dispatch-gate/dispatch-rate-snapshot-port";

export class WarmupLimiter {
	constructor(private readonly rateSnapshots: DispatchRateSnapshotPort) {}

	async getBudget(params: {
		instanceId: string;
		now: Date;
		maxMessagesPerHour: number;
	}): Promise<{
		usedMessageLikeInLastHour: number;
		remainingMessageLikeInLastHour: number;
	}> {
		const snapshot = await this.rateSnapshots.getSnapshot({
			instanceId: params.instanceId,
			now: params.now,
		});

		const used = snapshot.sentLastHour;

		const remaining = Math.max(0, params.maxMessagesPerHour - used);

		return {
			usedMessageLikeInLastHour: used,
			remainingMessageLikeInLastHour: remaining,
		};
	}
}

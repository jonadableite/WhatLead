import type { GetReputationTimelineUseCase } from "../../application/use-cases/get-reputation-timeline.use-case";
import type {
	DispatchRateSnapshot,
	DispatchRateSnapshotPort,
} from "../../application/dispatch-gate/dispatch-rate-snapshot-port";

export class TimelineDispatchRateSnapshotAdapter implements DispatchRateSnapshotPort {
	constructor(private readonly timeline: GetReputationTimelineUseCase) {}

	async getSnapshot(params: {
		instanceId: string;
		now: Date;
	}): Promise<DispatchRateSnapshot> {
		const sinceHour = new Date(params.now.getTime() - 60 * 60 * 1000);
		const sinceMinute = new Date(params.now.getTime() - 60 * 1000);
		const sinceFiveMinutes = new Date(params.now.getTime() - 5 * 60 * 1000);

		const hourSignals = await this.timeline.execute({
			instanceId: params.instanceId,
			since: sinceHour,
			until: params.now,
		});

		const messageLike = hourSignals.filter(
			(s) =>
				s.source === "DISPATCH" &&
				(s.type === "MESSAGE_SENT" || s.type === "REACTION_SENT"),
		);

		const sentLastHour = messageLike.length;
		const sentLastMinute = messageLike.filter(
			(s) => s.occurredAt.getTime() >= sinceMinute.getTime(),
		).length;

		const sorted = [...messageLike].sort(
			(a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
		);
		const oldestMessageAtLastHour = sorted[0]?.occurredAt ?? null;
		const lastMessageAt = sorted.length > 0 ? sorted[sorted.length - 1]!.occurredAt : null;

		const recentTextSignatures = hourSignals
			.filter((s) => s.source === "DISPATCH" && s.type === "MESSAGE_SENT")
			.filter((s) => s.occurredAt.getTime() >= sinceFiveMinutes.getTime())
			.map((s) => {
				const to = typeof s.remoteJid === "string" ? s.remoteJid : "";
				const text = typeof s.context?.["text"] === "string" ? (s.context["text"] as string) : "";
				if (!to || !text) return null;
				return `${to}:${text}`;
			})
			.filter((x): x is string => typeof x === "string");

		return {
			sentLastMinute,
			sentLastHour,
			lastMessageAt,
			oldestMessageAtLastHour,
			recentTextSignatures,
		};
	}
}

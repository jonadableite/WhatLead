import type {
	EvaluateInstanceHealthUseCaseResponse,
} from "../../domain/use-cases/evaluate-instance-health";
import type { WarmupPlan } from "./warmup-plan";

export class WarmupPlanFactory {
	static fromHealth(params: {
		instanceId: string;
		health: EvaluateInstanceHealthUseCaseResponse;
	}): WarmupPlan | null {
		const { instanceId, health } = params;
		if (!health.actions.includes("ALLOW_DISPATCH")) {
			return null;
		}
		if (health.actions.includes("ENTER_COOLDOWN")) {
			return null;
		}

		const phase =
			health.warmUpPhase === "NEWBORN" || health.warmUpPhase === "OBSERVER"
				? "BOOT"
				: health.warmUpPhase === "INTERACTING"
					? "SOFT"
					: "NORMAL";

		if (health.riskLevel === "HIGH") {
			return {
				instanceId,
				phase: "BOOT",
				allowedActions: ["SET_PRESENCE", "SEND_TEXT"],
				maxMessagesPerHour: 2,
				maxGroups: 0,
				maxActionsPerRun: 1,
				contentMix: { text: 100, reaction: 0, media: 0, sticker: 0 },
			};
		}

		switch (phase) {
			case "BOOT":
				return {
					instanceId,
					phase,
					allowedActions: ["SET_PRESENCE", "SEND_TEXT"],
					maxMessagesPerHour: 2,
					maxGroups: 0,
					maxActionsPerRun: 1,
					contentMix: { text: 100, reaction: 0, media: 0, sticker: 0 },
				};
			case "SOFT":
				return {
					instanceId,
					phase,
					allowedActions: ["SET_PRESENCE", "SEND_TEXT", "MARK_AS_READ"],
					maxMessagesPerHour: 6,
					maxGroups: 0,
					maxActionsPerRun: 2,
					contentMix: { text: 80, reaction: 20, media: 0, sticker: 0 },
				};
			case "NORMAL":
				return {
					instanceId,
					phase,
					allowedActions: ["SET_PRESENCE", "SEND_TEXT", "SEND_REACTION", "MARK_AS_READ"],
					maxMessagesPerHour: 12,
					maxGroups: 1,
					maxActionsPerRun: 3,
					contentMix: { text: 60, reaction: 20, media: 10, sticker: 10 },
				};
		}
	}
}

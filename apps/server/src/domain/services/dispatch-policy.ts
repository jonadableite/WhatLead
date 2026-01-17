import type { Instance } from "../entities/instance";
import type { InstanceReputation } from "../entities/instance-reputation";
import type { DispatchIntentSource } from "../value-objects/dispatch-intent-source";
import type { MessageType } from "../value-objects/message-type";
import { allowDispatch, blockDispatch, type DispatchDecision } from "../value-objects/dispatch-decision";

export class DispatchPolicy {
	evaluate(params: {
		instance: Instance;
		reputation: InstanceReputation;
		intentSource: DispatchIntentSource;
		messageType: MessageType;
		now: Date;
	}): DispatchDecision {
		const { instance, reputation, intentSource, messageType, now } = params;

		if (instance.lifecycleStatus !== "ACTIVE") {
			return blockDispatch({ reason: "INSTANCE_NOT_ACTIVE" });
		}

		if (instance.connectionStatus !== "CONNECTED") {
			return blockDispatch({ reason: "INSTANCE_NOT_CONNECTED" });
		}

		if (!reputation.canDispatch(now)) {
			if (reputation.temperatureLevel === "COOLDOWN") {
				return blockDispatch({ reason: "COOLDOWN" });
			}
			if (reputation.temperatureLevel === "OVERHEATED") {
				return blockDispatch({ reason: "OVERHEATED" });
			}
			return blockDispatch({ reason: "POLICY_BLOCKED" });
		}

		const warmUpPhase = reputation.currentWarmUpPhase(now);
		const risk = reputation.getRiskLevel();

		const isWarmupLike = intentSource === "WARMUP" || instance.purpose === "WARMUP";

		const allowedMessageTypes = (() => {
			if (warmUpPhase === "NEWBORN" || warmUpPhase === "OBSERVER") {
				return ["TEXT", "REACTION"] as const;
			}
			if (warmUpPhase === "INTERACTING") {
				return ["TEXT", "REACTION"] as const;
			}
			if (warmUpPhase === "SOCIAL" || warmUpPhase === "READY") {
				return ["TEXT", "REACTION", "STICKER", "IMAGE", "AUDIO"] as const;
			}
			return ["TEXT"] as const;
		})();

		if (isWarmupLike && (messageType === "IMAGE" || messageType === "AUDIO")) {
			if (warmUpPhase === "NEWBORN" || warmUpPhase === "OBSERVER" || warmUpPhase === "INTERACTING") {
				return blockDispatch({
					reason: "UNSUPPORTED_MESSAGE_TYPE",
					allowedMessageTypes,
				});
			}
		}

		if (!allowedMessageTypes.includes(messageType as any)) {
			return blockDispatch({
				reason: "UNSUPPORTED_MESSAGE_TYPE",
				allowedMessageTypes,
			});
		}

		const maxMessages =
			risk === "high"
				? 1
				: risk === "medium"
					? 3
					: warmUpPhase === "NEWBORN" || warmUpPhase === "OBSERVER"
						? 2
						: warmUpPhase === "INTERACTING"
							? 6
							: 12;

		const minIntervalSeconds =
			risk === "high"
				? 60 * 10
				: risk === "medium"
					? 60 * 3
					: warmUpPhase === "NEWBORN" || warmUpPhase === "OBSERVER"
						? 60 * 5
						: warmUpPhase === "INTERACTING"
							? 60 * 2
							: 60;

		return allowDispatch({
			maxMessages,
			minIntervalSeconds,
			allowedMessageTypes,
		});
	}
}


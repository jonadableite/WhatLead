import type { Instance } from "../entities/instance";
import type { MessageIntentPurpose } from "../value-objects/message-intent-purpose";

export class InstanceDispatchScoreService {
	score(params: { instance: Instance; intentPurpose: MessageIntentPurpose }): number {
		const { instance, intentPurpose } = params;

		const risk = instance.reputation.getRiskLevel();
		const riskScore = risk === "low" ? 30 : risk === "medium" ? 10 : 0;

		const purposeScore =
			intentPurpose === "WARMUP"
				? instance.purpose === "DISPATCH"
					? 0
					: 20
				: instance.purpose === "WARMUP"
					? 0
					: instance.purpose === "MIXED"
						? 10
						: 20;

		const connectionScore = instance.connectionStatus === "CONNECTED" ? 30 : 0;
		const lifecycleScore = instance.lifecycleStatus === "ACTIVE" ? 20 : 0;

		return riskScore + purposeScore + connectionScore + lifecycleScore;
	}
}


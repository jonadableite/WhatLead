import type { DispatchGateUseCase } from "../../dispatch-gate/dispatch-gate.use-case";
import type { DispatchAction } from "../../heater/dispatch-port";

export class DispatchBlockedError extends Error {
	constructor(public readonly instanceId: string) {
		super(`Dispatch blocked for instance ${instanceId}`);
		this.name = "DispatchBlockedError";
	}
}

export class PreDispatchGuard {
	constructor(private readonly gate: DispatchGateUseCase) {}

	async ensureCanDispatch(action: DispatchAction, now: Date = new Date()): Promise<void> {
		if (action.type !== "SEND_TEXT" && action.type !== "SEND_REACTION") {
			return;
		}

		const payload =
			action.type === "SEND_TEXT"
				? ({ type: "TEXT", to: action.to, text: action.text } as const)
				: ({
						type: "REACTION",
						to: action.to,
						messageId: action.messageId,
						emoji: action.emoji,
					} as const);

		const result = await this.gate.execute({
			instanceId: action.instanceId,
			type: "WARMUP",
			payload,
			reason: "SYSTEM",
			now,
		});

		if (!result.allowed) {
			throw new DispatchBlockedError(action.instanceId);
		}
	}
}

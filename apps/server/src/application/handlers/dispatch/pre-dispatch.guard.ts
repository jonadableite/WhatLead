import type { EvaluateInstanceHealthUseCase } from "../../../domain/use-cases/evaluate-instance-health";

export class DispatchBlockedError extends Error {
	constructor(public readonly instanceId: string) {
		super(`Dispatch blocked for instance ${instanceId}`);
		this.name = "DispatchBlockedError";
	}
}

export class PreDispatchGuard {
	constructor(private readonly evaluateInstanceHealth: EvaluateInstanceHealthUseCase) {}

	async ensureCanDispatch(instanceId: string, now: Date = new Date()): Promise<void> {
		const result = await this.evaluateInstanceHealth.execute({
			instanceId,
			reason: "PRE_DISPATCH",
			now,
		});

		if (result.actions.includes("BLOCK_DISPATCH")) {
			throw new DispatchBlockedError(instanceId);
		}
	}
}


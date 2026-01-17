import type { DispatchAction, DispatchPort, DispatchResult } from "./dispatch-port";

export class DelayedDispatchPort implements DispatchPort {
	constructor(private readonly inner: DispatchPort) {}

	async send(action: DispatchAction): Promise<DispatchResult> {
		if (typeof action.delayMs === "number" && action.delayMs > 0) {
			await new Promise<void>((resolve) => {
				setTimeout(resolve, action.delayMs);
			});
		}
		return await this.inner.send(action);
	}
}


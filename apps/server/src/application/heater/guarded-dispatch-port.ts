import type { DispatchPort, DispatchResult } from "./dispatch-port";
import type { DispatchAction } from "./dispatch-port";
import type { PreDispatchGuard } from "../handlers/dispatch/pre-dispatch.guard";

export class GuardedDispatchPort implements DispatchPort {
	constructor(
		private readonly inner: DispatchPort,
		private readonly guard: PreDispatchGuard,
	) {}

	async send(action: DispatchAction): Promise<DispatchResult> {
		if (action.type === "SEND_TEXT" || action.type === "SEND_REACTION") {
			await this.guard.ensureCanDispatch(action.instanceId);
		}

		return await this.inner.send(action);
	}
}


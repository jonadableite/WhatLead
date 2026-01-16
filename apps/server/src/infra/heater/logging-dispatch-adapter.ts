import { createChildLogger } from "@WhatLead/logger";
import type { DispatchAction, DispatchPort, DispatchResult } from "../../application/heater/dispatch-port";

export class LoggingDispatchAdapter implements DispatchPort {
	private readonly logger = createChildLogger({ component: "heater_dispatch" });

	async send(action: DispatchAction): Promise<DispatchResult> {
		this.logger.info({ action }, "Dispatch action");

		if (action.type === "SEND_TEXT") {
			return {
				success: true,
				producedEvents: [
					{
						type: "MESSAGE_SENT",
						instanceId: action.instanceId,
						occurredAt: new Date(),
						isGroup: false,
						remoteJid: action.to,
						metadata: { messageType: "text" },
					},
				],
			};
		}

		return { success: true, producedEvents: [] };
	}
}


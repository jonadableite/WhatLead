import type { DispatchUseCase } from "../dispatch/dispatch.use-case";
import type { ReplyIntent } from "./reply-intent";

export class ReplyIntentDispatcher {
	constructor(private readonly dispatch: DispatchUseCase) {}

	async execute(intent: ReplyIntent): Promise<void> {
		if (intent.type === "NONE") {
			return;
		}

		if (intent.type === "TEXT") {
			const out = await this.dispatch.execute({
				instanceId: intent.instanceId,
				intent: { source: "BOT", reason: intent.reason },
				message: { type: "TEXT", to: intent.payload.to, text: intent.payload.text },
			});
			if (out.result.status === "BLOCKED") {
				return;
			}
			return;
		}

		if (intent.type === "REACTION") {
			const out = await this.dispatch.execute({
				instanceId: intent.instanceId,
				intent: { source: "BOT", reason: intent.reason },
				message: {
					type: "REACTION",
					to: intent.payload.to,
					messageId: intent.payload.messageId,
					emoji: intent.payload.emoji,
				},
			});
			if (out.result.status === "BLOCKED") {
				return;
			}
		}
	}
}

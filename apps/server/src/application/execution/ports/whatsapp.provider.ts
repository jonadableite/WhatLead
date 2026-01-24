import type { MessageIntentPayload } from "../../domain/value-objects/message-intent-payload";
import type { MessageTarget } from "../../domain/value-objects/message-target";

export interface SendMessageCommand {
	instanceId: string;
	target: MessageTarget;
	payload: MessageIntentPayload;
}

export interface ExecutionWhatsAppProvider {
	send(command: SendMessageCommand): Promise<void>;
}

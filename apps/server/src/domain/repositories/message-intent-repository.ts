import type { MessageIntent } from "../entities/message-intent";

export interface MessageIntentRepository {
	create(intent: MessageIntent): Promise<void>;
	findById(intentId: string): Promise<MessageIntent | null>;
	save(intent: MessageIntent): Promise<void>;
	listPendingByOrg(organizationId: string, limit: number): Promise<MessageIntent[]>;
}


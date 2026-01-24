import type { MessageIntent } from "../entities/message-intent";
import type { MessageIntentPurpose } from "../value-objects/message-intent-purpose";
import type { MessageIntentStatus } from "../value-objects/message-intent-status";

export interface MessageIntentListFilters {
	organizationId: string;
	status?: MessageIntentStatus;
	purpose?: MessageIntentPurpose;
	instanceId?: string;
	limit: number;
}

export interface MessageIntentRepository {
	create(intent: MessageIntent): Promise<void>;
	findById(intentId: string): Promise<MessageIntent | null>;
	save(intent: MessageIntent): Promise<void>;
	listPendingByOrg(organizationId: string, limit: number): Promise<MessageIntent[]>;
	listApproved(limit: number): Promise<MessageIntent[]>;
	listByFilters(filters: MessageIntentListFilters): Promise<MessageIntent[]>;
}

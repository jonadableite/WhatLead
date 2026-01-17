import { Conversation } from "../../domain/entities/conversation";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";

export class OpenConversationForLeadUseCase {
	constructor(
		private readonly instances: InstanceRepository,
		private readonly conversations: ConversationRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(params: {
		instanceId: string;
		contactId: string;
		leadId?: string;
		now?: Date;
	}): Promise<Conversation> {
		const now = params.now ?? new Date();

		const instance = await this.instances.findById(params.instanceId);
		if (!instance) {
			throw new Error("NO_INSTANCE");
		}

		const conversation = Conversation.open({
			id: this.idFactory.createId(),
			tenantId: instance.companyId,
			channel: "WHATSAPP",
			instanceId: params.instanceId,
			contactId: params.contactId,
			openedAt: now,
		});

		if (params.leadId) {
			conversation.linkLead(params.leadId);
		}
		await this.conversations.save(conversation);
		return conversation;
	}
}

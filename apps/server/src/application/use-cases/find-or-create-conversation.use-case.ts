import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import { Conversation } from "../../domain/entities/conversation";

export class FindOrCreateConversationUseCase {
	constructor(
		private readonly instanceRepository: InstanceRepository,
		private readonly conversationRepository: ConversationRepository,
		private readonly idFactory: { createId(): string },
	) {}

	async execute(params: {
		instanceId: string;
		contactId: string;
		leadId?: string | null;
		kind?: import("../../domain/value-objects/conversation-kind").ConversationKind;
		now: Date;
	}): Promise<Conversation> {
		if (params.leadId) {
			const byLead = await this.conversationRepository.findActiveByInstanceAndLead({
				instanceId: params.instanceId,
				leadId: params.leadId,
			});
			if (byLead) {
				return byLead;
			}
		}

		const existing = await this.conversationRepository.findActiveByInstanceAndContact({
			instanceId: params.instanceId,
			contactId: params.contactId,
		});
		if (existing) {
			return existing;
		}

		const instance = await this.instanceRepository.findById(params.instanceId);
		if (!instance) {
			throw new Error("Instance not found");
		}

		const conversation = Conversation.open({
			id: this.idFactory.createId(),
			tenantId: instance.companyId,
			channel: "WHATSAPP",
			instanceId: instance.id,
			contactId: params.contactId,
			kind: params.kind,
			openedAt: params.now,
		});
		if (params.leadId) {
			conversation.linkLead(params.leadId);
		}

		await this.conversationRepository.save(conversation);
		return conversation;
	}
}

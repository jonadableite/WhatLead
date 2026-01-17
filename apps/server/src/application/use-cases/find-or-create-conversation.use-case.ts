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
		now: Date;
	}): Promise<Conversation> {
		const existing =
			await this.conversationRepository.findActiveByInstanceAndContact({
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
			openedAt: params.now,
		});

		await this.conversationRepository.save(conversation);
		return conversation;
	}
}


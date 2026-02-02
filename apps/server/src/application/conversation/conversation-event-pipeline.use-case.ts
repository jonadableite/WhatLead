import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { ConversationRouter } from "./conversation-router";
import type { AssignConversationUseCase } from "./assign-conversation.use-case";
import type { ReplyIntentDispatcher } from "./reply-intent-dispatcher";
import type { InboundMessageUseCase } from "../use-cases/inbound-message.use-case";
import type { OutboundMessageRecordedUseCase } from "../use-cases/outbound-message-recorded.use-case";
import type { UpdateLeadOnInboundUseCase } from "../sdr/update-lead-on-inbound.use-case";
import type { ExecutionEngineUseCase } from "../execution-engine/execution-engine.use-case";
import type { MessageEvent } from "../../domain/entities/conversation-timeline-event";

export class ConversationEventPipelineUseCase {
	constructor(
		private readonly inbound: InboundMessageUseCase,
		private readonly outbound: OutboundMessageRecordedUseCase,
		private readonly conversations: ConversationRepository,
		private readonly instances: InstanceRepository,
		private readonly router: ConversationRouter,
		private readonly assignConversation: AssignConversationUseCase,
		private readonly replyDispatcher: ReplyIntentDispatcher,
		private readonly updateLeadOnInbound: UpdateLeadOnInboundUseCase,
		private readonly executionEngine: ExecutionEngineUseCase | null = null,
		private readonly idFactory: { createId(): string } = { createId: () => crypto.randomUUID() },
	) {}

	async execute(event: NormalizedWhatsAppEvent): Promise<void> {
		const inbound = await this.inbound.execute(event);
		if (inbound) {
			const conversation = await this.conversations.findById({
				id: inbound.conversationId,
			});
			const instance = await this.instances.findById(event.instanceId);

			if (conversation && instance) {
				await this.updateLeadOnInbound.execute({
					conversationId: inbound.conversationId,
					event,
				});

				const decision = await this.router.route({
					conversation,
					instance,
					inboundEvent: event,
				});

				await this.assignConversation.execute({
					conversationId: conversation.id,
					decision,
				});

				await this.replyDispatcher.execute(decision.replyIntent);

				// Plan and enqueue execution jobs for the inbound message
				if (this.executionEngine) {
					const timelineEvent = this.buildMessageEvent(event);
					await this.executionEngine.planAndEnqueue(timelineEvent, conversation);
				}
			}
		}

		await this.outbound.execute(event);
	}

	private buildMessageEvent(event: NormalizedWhatsAppEvent): MessageEvent & { id: string } {
		return {
			id: this.idFactory.createId(),
			type: "MESSAGE",
			messageId: event.messageId ?? this.idFactory.createId(),
			direction: event.type === "MESSAGE_RECEIVED" ? "INBOUND" : "OUTBOUND",
			origin: "MANUAL",
			payload: {
				kind: "TEXT",
				text: (event.metadata?.text as string) ?? undefined,
			},
			createdAt: event.occurredAt,
		};
	}
}

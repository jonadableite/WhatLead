import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { LeadRepository } from "../../domain/repositories/lead-repository";
import { Lead } from "../../domain/entities/lead";
import { FindOrCreateConversationUseCase } from "./find-or-create-conversation.use-case";
import type { MessageRepository } from "../../domain/repositories/message-repository";
import type { DomainEventBus } from "../../domain/events/domain-event-bus";
import type { ChatMessageDomainEvent } from "../../domain/events/chat-message-events";
import { type ContactIdentity, normalizePhone, parseContactIdentity } from "../conversations/contact-utils";

export class InboundMessageUseCase {
	private readonly findOrCreateConversation: FindOrCreateConversationUseCase;

	constructor(params: {
		instanceRepository: InstanceRepository;
		conversationRepository: ConversationRepository;
		messageRepository: MessageRepository;
		leadRepository: LeadRepository;
		idFactory: { createId(): string };
		eventBus: DomainEventBus<ChatMessageDomainEvent>;
	}) {
		this.eventBus = params.eventBus;
		this.instanceRepository = params.instanceRepository;
		this.leads = params.leadRepository;
		this.findOrCreateConversation = new FindOrCreateConversationUseCase(
			params.instanceRepository,
			params.conversationRepository,
			params.idFactory,
		);
		this.idFactory = params.idFactory;

		this.appendInbound = async (args) => {
			if (args.providerMessageId) {
				const exists = await params.messageRepository.existsByProviderMessageId({
					conversationId: args.conversation.id,
					providerMessageId: args.providerMessageId,
				});
				if (exists) {
					return;
				}
			}

			const message = args.conversation.receiveInboundMessage({
				messageId: params.idFactory.createId(),
				type: args.type,
				providerMessageId: args.providerMessageId,
				contentRef: args.contentRef,
				metadata: args.metadata,
				occurredAt: args.occurredAt,
			});

			await params.messageRepository.append(message);
			await params.conversationRepository.save(args.conversation);
			await this.eventBus.publish({
				type: "MESSAGE_RECEIVED",
				occurredAt: message.occurredAt,
				organizationId: args.conversation.tenantId,
				instanceId: args.conversation.instanceId,
				conversationId: args.conversation.id,
				message: {
					id: message.id,
					direction: message.direction,
					type: message.type,
					sentBy: message.sentBy,
					status: message.status,
					body: message.contentRef,
				},
			});
		};
	}

	private readonly appendInbound: (args: {
		conversation: import("../../domain/entities/conversation").Conversation;
		type: import("../../domain/value-objects/message-type").MessageType;
		providerMessageId?: string;
		contentRef?: string;
		metadata?: Record<string, unknown>;
		occurredAt: Date;
	}) => Promise<void>;
	private readonly eventBus: DomainEventBus<ChatMessageDomainEvent>;
	private readonly instanceRepository: InstanceRepository;
	private readonly leads: LeadRepository;
	private readonly idFactory: { createId(): string };

	async execute(event: NormalizedWhatsAppEvent): Promise<{ conversationId: string } | null> {
		if (event.type !== "MESSAGE_RECEIVED") {
			return null;
		}
		if (event.isGroup) {
			return null;
		}

		const identity = parseContactIdentity(event.remoteJid);
		if (!identity) return null;

		const instance = await this.instanceRepository.findById(event.instanceId);
		if (!instance) {
			throw new Error("Instance not found");
		}

		const tenantId = instance.companyId;
		const lead = await this.resolveLead({ tenantId, identity, event });

		const leadPhone = normalizePhone(lead?.phone ?? "");
		const contactId = leadPhone || identity.contactId;

		const conversation = await this.findOrCreateConversation.execute({
			instanceId: event.instanceId,
			contactId,
			leadId: lead?.id ?? null,
			now: event.occurredAt,
		});

		await this.appendInbound({
			conversation,
			type: inferMessageType(event),
			providerMessageId: event.messageId,
			contentRef: inferContentRef(event),
			metadata: event.metadata,
			occurredAt: event.occurredAt,
		});

		return { conversationId: conversation.id };
	}

	private async resolveLead(params: {
		tenantId: string;
		identity: ContactIdentity;
		event: NormalizedWhatsAppEvent;
	}): Promise<import("../../domain/entities/lead").Lead | null> {
		const { tenantId, identity, event } = params;
		if (!identity) return null;

		let lead =
			identity.kind === "PHONE" && identity.phone
				? await this.leads.findByPhone({ tenantId, phone: identity.phone })
				: null;

		if (!lead && identity.kind === "LID" && identity.lid) {
			lead = await this.leads.findByLid({ tenantId, lid: identity.lid });
		}

		if (lead) {
			const updates: { phone?: string; lid?: string | null } = {};
			if (identity.kind === "PHONE" && identity.phone && !normalizePhone(lead.phone)) {
				updates.phone = identity.phone;
			}
			if (identity.kind === "LID" && identity.lid && !lead.lid) {
				updates.lid = identity.lid;
			}
			if (Object.keys(updates).length > 0) {
				lead.updateIdentity(updates);
				await this.leads.save(lead);
			}
			return lead;
		}

		if (identity.kind === "LID" && identity.lid) {
			const displayName = event.metadata?.["pushName"];
			const leadName = typeof displayName === "string" && displayName.trim() ? displayName.trim() : "Contato";
			const phone = identity.phone ? identity.phone : "";
			const newLead = Lead.create({
				id: this.idFactory.createId(),
				tenantId,
				campaignId: null,
				name: leadName,
				email: "",
				phone,
				lid: identity.lid,
				stage: "NEW",
				createdAt: event.occurredAt,
			});
			await this.leads.save(newLead);
			return newLead;
		}

		if (identity.kind === "NEWSLETTER") {
			const displayName = event.metadata?.["pushName"];
			const leadName = typeof displayName === "string" && displayName.trim() ? displayName.trim() : "Contato";
			const newLead = Lead.create({
				id: this.idFactory.createId(),
				tenantId,
				campaignId: null,
				name: leadName,
				email: "",
				phone: "",
				lid: null,
				stage: "NEW",
				createdAt: event.occurredAt,
			});
			await this.leads.save(newLead);
			return newLead;
		}

		return null;
	}
}

const inferMessageType = (event: NormalizedWhatsAppEvent) => {
	const messageType = event.metadata?.["messageType"];
	if (messageType === "audio") return "AUDIO";
	if (messageType === "image") return "IMAGE";
	if (messageType === "sticker") return "STICKER";
	return "TEXT";
};

const inferContentRef = (event: NormalizedWhatsAppEvent): string | undefined => {
	const text = event.metadata?.["text"];
	if (typeof text === "string" && text.trim()) {
		return text;
	}
	return undefined;
};

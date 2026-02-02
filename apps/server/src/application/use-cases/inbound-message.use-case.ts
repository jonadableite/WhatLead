import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { LeadRepository } from "../../domain/repositories/lead-repository";
import { Lead } from "../../domain/entities/lead";
import { type ContactIdentity, normalizePhone, parseContactIdentity } from "../conversations/contact-utils";
import type { ConversationEngineUseCase } from "../conversations/conversation-engine.use-case";

export class InboundMessageUseCase {
	constructor(params: {
		instanceRepository: InstanceRepository;
		conversationEngine: ConversationEngineUseCase;
		leadRepository: LeadRepository;
		idFactory: { createId(): string };
	}) {
		this.instanceRepository = params.instanceRepository;
		this.leads = params.leadRepository;
		this.engine = params.conversationEngine;
		this.idFactory = params.idFactory;
	}

	private readonly instanceRepository: InstanceRepository;
	private readonly leads: LeadRepository;
	private readonly idFactory: { createId(): string };
	private readonly engine: ConversationEngineUseCase;

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
		const result = await this.engine.processInbound({
			event,
			contactId,
			leadId: lead?.id ?? null,
			kind: event.isGroup ? "GROUP" : "PRIVATE",
		});

		return result;
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


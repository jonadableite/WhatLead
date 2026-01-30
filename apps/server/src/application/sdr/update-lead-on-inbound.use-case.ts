import type { NormalizedWhatsAppEvent } from "../event-handlers/webhook-event-handler";
import type { ConversationRepository } from "../../domain/repositories/conversation-repository";
import type { LeadRepository } from "../../domain/repositories/lead-repository";
import type { ContactInfo, WhatsAppProvider } from "../providers/whatsapp-provider";
import { isContactCapable } from "../providers/whatsapp-provider";
import { normalizeLid, normalizePhone, parseContactIdentity } from "../conversations/contact-utils";

export class UpdateLeadOnInboundUseCase {
	constructor(
		private readonly conversations: ConversationRepository,
		private readonly leads: LeadRepository,
		private readonly provider: WhatsAppProvider,
	) {}

	async execute(params: { conversationId: string; event: NormalizedWhatsAppEvent }): Promise<void> {
		if (params.event.type !== "MESSAGE_RECEIVED") {
			return;
		}
		if (params.event.isGroup) {
			return;
		}

		const conversation = await this.conversations.findById({ id: params.conversationId });
		if (!conversation?.leadId) {
			return;
		}

		const lead = await this.leads.findById({ id: conversation.leadId });
		if (!lead) {
			return;
		}

		let shouldSave = false;
		if (lead.stage === "NEW" || lead.stage === "CONTACTED") {
			lead.changeStage("QUALIFIED");
			shouldSave = true;
		}

		const shouldUpdateName = needsNameRefresh(lead.name, {
			phone: lead.phone,
			lid: lead.lid,
			remoteJid: params.event.remoteJid,
		});

		if (
			(shouldUpdateName || !lead.profilePicUrl) &&
			params.event.remoteJid &&
			isContactCapable(this.provider)
		) {
			try {
				const contactInfo = await this.provider.getContactInfo(
					params.event.instanceId,
					params.event.remoteJid,
				);
				const displayName = resolveDisplayName(contactInfo);
				if (shouldUpdateName && displayName) {
					lead.updateIdentity({ name: displayName });
					shouldSave = true;
				}
				if (!lead.profilePicUrl && contactInfo?.profilePicUrl) {
					lead.updateProfilePicture(contactInfo.profilePicUrl);
					shouldSave = true;
				}
			} catch {
				// Ignore provider lookup errors to avoid blocking inbound updates.
			}
		}

		if (!lead.profilePicUrl && params.event.remoteJid && isContactCapable(this.provider)) {
			try {
				const profilePicUrl = await this.provider.getProfilePicture(
					params.event.instanceId,
					params.event.remoteJid,
				);
				if (profilePicUrl) {
					lead.updateProfilePicture(profilePicUrl);
					shouldSave = true;
				}
			} catch {
				// Ignore provider lookup errors to avoid blocking inbound updates.
			}
		}

		if (shouldSave) {
			await this.leads.save(lead);
		}
	}
}

const resolveDisplayName = (contactInfo: ContactInfo | null): string | null => {
	if (!contactInfo) return null;
	const candidates = [contactInfo.name, contactInfo.pushName, contactInfo.businessName];
	for (const candidate of candidates) {
		if (typeof candidate === "string" && candidate.trim()) {
			return candidate.trim();
		}
	}
	return null;
};

const needsNameRefresh = (
	leadName: string,
	params: { phone?: string | null; lid?: string | null; remoteJid?: string },
): boolean => {
	const name = leadName?.trim();
	if (!name) return true;
	const normalizedName = name.toLowerCase();

	if (normalizedName === "contato" || normalizedName === "contact") {
		return true;
	}

	const phone = normalizePhone(params.phone ?? "");
	if (phone && normalizePhone(name) === phone) {
		return true;
	}

	const lid = normalizeLid(params.lid ?? "");
	if (lid && normalizedName === lid.toLowerCase()) {
		return true;
	}

	const identity = parseContactIdentity(params.remoteJid);
	if (identity?.contactId && normalizedName === identity.contactId.toLowerCase()) {
		return true;
	}
	if (params.remoteJid && normalizedName === params.remoteJid.toLowerCase()) {
		return true;
	}

	return false;
};


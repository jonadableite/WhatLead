import type { Lead } from "../../domain/entities/lead";

export type ContactIdentityKind = "PHONE" | "LID" | "RAW";

export interface ContactIdentity {
	kind: ContactIdentityKind;
	raw: string;
	contactId: string;
	phone?: string;
	lid?: string;
}

const JID_DOMAINS = ["@s.whatsapp.net", "@c.us"];
const LID_DOMAIN = "@lid";

export const normalizePhone = (value: string): string => value.replace(/\D/g, "");

export const normalizeLid = (value: string): string => {
	const trimmed = value.trim();
	if (!trimmed) return "";
	return trimmed.toLowerCase().endsWith(LID_DOMAIN)
		? trimmed.slice(0, -LID_DOMAIN.length)
		: trimmed;
};

export const parseContactIdentity = (remoteJid?: string): ContactIdentity | null => {
	if (!remoteJid) return null;
	const raw = remoteJid.trim();
	if (!raw) return null;

	const lower = raw.toLowerCase();
	for (const domain of JID_DOMAINS) {
		if (lower.endsWith(domain)) {
			const phone = normalizePhone(raw.slice(0, -domain.length));
			if (!phone) return null;
			return { kind: "PHONE", raw, phone, contactId: phone };
		}
	}

	if (lower.endsWith(LID_DOMAIN)) {
		const lid = normalizeLid(raw);
		if (!lid) return null;
		const phoneCandidate = normalizePhone(lid);
		const contactId = phoneCandidate.length >= 8 ? phoneCandidate : lid;
		return { kind: "LID", raw, lid, phone: phoneCandidate || undefined, contactId };
	}

	const digits = normalizePhone(raw);
	if (digits.length >= 8 && /^[\d+]+$/.test(raw)) {
		return { kind: "PHONE", raw, phone: digits, contactId: digits };
	}

	return { kind: "RAW", raw, contactId: raw };
};

export const resolveOutboundRecipient = (params: {
	conversationContactId: string;
	lead?: Lead | null;
}): string | null => {
	const leadPhone = normalizePhone(params.lead?.phone ?? "");
	if (leadPhone) return leadPhone;

	const leadLid = normalizeLid(params.lead?.lid ?? "");
	if (leadLid) return leadLid;

	const identity = parseContactIdentity(params.conversationContactId);
	if (!identity) return null;
	if (identity.kind === "PHONE" && identity.phone) return identity.phone;
	if (identity.kind === "LID" && identity.lid) return identity.lid;
	return identity.contactId || null;
};

export const formatContactLabel = (params: {
	leadName?: string | null;
	phone?: string | null;
	lid?: string | null;
	contactId?: string | null;
}): string | null => {
	if (params.leadName?.trim()) return params.leadName.trim();

	const phone = normalizePhone(params.phone ?? "");
	if (phone) return phone;

	const lid = normalizeLid(params.lid ?? "");
	if (lid) return lid;

	const identity = parseContactIdentity(params.contactId ?? undefined);
	if (!identity) return null;
	if (identity.kind === "PHONE" && identity.phone) return identity.phone;
	if (identity.kind === "LID" && identity.lid) return identity.lid;
	return identity.contactId || null;
};

import { apiFetch } from "@/lib/api/api-fetch";
import type {
	ListMessageIntentsResponse,
	MessageIntentPurpose,
	MessageIntentStatus,
} from "./message-intents-types";

export interface ListMessageIntentsFilters {
	status?: MessageIntentStatus;
	purpose?: MessageIntentPurpose;
	instanceId?: string;
	limit?: number;
}

export const listMessageIntents = async (
	filters: ListMessageIntentsFilters = {},
): Promise<ListMessageIntentsResponse> => {
	const params = new URLSearchParams();

	if (filters.status) params.set("status", filters.status);
	if (filters.purpose) params.set("purpose", filters.purpose);
	if (filters.instanceId) params.set("instanceId", filters.instanceId);
	if (filters.limit) params.set("limit", String(filters.limit));

	const query = params.toString();
	return apiFetch<ListMessageIntentsResponse>(
		`/api/message-intents${query ? `?${query}` : ""}`,
	);
};

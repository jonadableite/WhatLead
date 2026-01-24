import { apiFetch } from "@/lib/api/api-fetch";
import type {
	ExecutionMetricsSnapshot,
	MessageIntentTimelineResponse,
} from "./ops-types";

export const getOrgMetrics = async (
	window?: number,
): Promise<ExecutionMetricsSnapshot> => {
	const query = window ? `?window=${encodeURIComponent(window)}` : "";
	return apiFetch<ExecutionMetricsSnapshot>(`/api/ops/metrics${query}`);
};

export const getInstanceMetrics = async (
	instanceId: string,
	window?: number,
): Promise<ExecutionMetricsSnapshot> => {
	const query = window ? `?window=${encodeURIComponent(window)}` : "";
	return apiFetch<ExecutionMetricsSnapshot>(
		`/api/ops/instances/${encodeURIComponent(instanceId)}/metrics${query}`,
	);
};

export const pauseInstance = async (
	instanceId: string,
	params?: { reason?: string; until?: string | null },
): Promise<{ ok: boolean }> =>
	apiFetch<{ ok: boolean }>(`/api/ops/instances/${encodeURIComponent(instanceId)}/pause`, {
		method: "POST",
		body: JSON.stringify(params ?? {}),
	});

export const resumeInstance = async (instanceId: string): Promise<{ ok: boolean }> =>
	apiFetch<{ ok: boolean }>(`/api/ops/instances/${encodeURIComponent(instanceId)}/resume`, {
		method: "POST",
		body: JSON.stringify({}),
	});

export const getMessageIntentTimeline = async (
	intentId: string,
	limit?: number,
): Promise<MessageIntentTimelineResponse> => {
	const query = limit ? `?limit=${encodeURIComponent(limit)}` : "";
	return apiFetch<MessageIntentTimelineResponse>(
		`/api/ops/message-intents/${encodeURIComponent(intentId)}/timeline${query}`,
	);
};

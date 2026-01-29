import { apiFetch } from "@/lib/api/api-fetch";
import type { ListOperatorsResponse, OperatorMeResponse } from "./operator-types";

export const listOperators = async (params?: {
	status?: "ONLINE" | "AWAY" | "OFFLINE";
	limit?: number;
}): Promise<ListOperatorsResponse> => {
	const query = new URLSearchParams();
	if (params?.status) query.set("status", params.status);
	if (typeof params?.limit === "number") query.set("limit", String(params.limit));
	const suffix = query.toString();
	return apiFetch(`/api/operators${suffix ? `?${suffix}` : ""}`);
};

export const getOperatorMe = async (): Promise<OperatorMeResponse> => {
	return apiFetch("/api/operators/me");
};

export const assignConversationToOperator = async (params: {
	conversationId: string;
	operatorId: string;
}): Promise<void> => {
	await apiFetch("/api/operators/assign", {
		method: "POST",
		body: JSON.stringify(params),
	});
};

export const releaseConversation = async (params: {
	conversationId: string;
	operatorId: string;
}): Promise<void> => {
	await apiFetch("/api/operators/release", {
		method: "POST",
		body: JSON.stringify(params),
	});
};

export const transferConversation = async (params: {
	conversationId: string;
	fromOperatorId: string;
	toOperatorId: string;
}): Promise<void> => {
	await apiFetch("/api/operators/transfer", {
		method: "POST",
		body: JSON.stringify(params),
	});
};

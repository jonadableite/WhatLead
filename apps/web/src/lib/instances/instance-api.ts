import { apiFetch } from "@/lib/api/api-fetch";
import type {
	CreateInstanceResponse,
	InstanceHealthResponse,
	ListInstancesResponse,
} from "./instance-types";
import type { InstancePurpose, WhatsAppEngine } from "./instance-types";

export const listInstances = async (): Promise<ListInstancesResponse> =>
	apiFetch<ListInstancesResponse>("/api/instances");

export const createInstance = async (params: {
	displayName: string;
	phoneNumber: string;
	purpose: InstancePurpose;
	engine: WhatsAppEngine;
}): Promise<CreateInstanceResponse> =>
	apiFetch<CreateInstanceResponse>("/api/instances", {
		method: "POST",
		body: JSON.stringify(params),
	});

export const connectInstance = async (instanceId: string): Promise<void> => {
	await apiFetch(`/api/instances/${encodeURIComponent(instanceId)}/connect`, {
		method: "POST",
		body: JSON.stringify({}),
	});
};

export const reconnectInstance = async (instanceId: string): Promise<void> => {
	await apiFetch(`/api/instances/${encodeURIComponent(instanceId)}/reconnect`, {
		method: "POST",
		body: JSON.stringify({}),
	});
};

export const getInstance = async (instanceId: string) =>
	apiFetch(`/api/instances/${encodeURIComponent(instanceId)}`);

export const getInstanceHealth = async (
	instanceId: string,
): Promise<InstanceHealthResponse> =>
	apiFetch<InstanceHealthResponse>(
		`/api/instances/${encodeURIComponent(instanceId)}/health`,
	);

export const evaluateInstanceHealth = async (
	instanceId: string,
): Promise<InstanceHealthResponse> =>
	apiFetch<InstanceHealthResponse>(
		`/api/instances/${encodeURIComponent(instanceId)}/health/evaluate`,
		{
			method: "POST",
			body: JSON.stringify({}),
		},
	);


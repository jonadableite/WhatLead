/**
 * TurboZap HTTP Client
 *
 * Type-safe HTTP client for the TurboZap/WhatsMeow API.
 * Handles authentication, error handling, and response parsing.
 *
 * API Docs: https://turbozap.api.docs (based on user-provided specs)
 */

import type { ProviderConfig } from "../../../../application/providers/types";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES (TurboZap API specific)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard TurboZap API response wrapper.
 */
interface TurboZapResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

/**
 * Instance status from TurboZap.
 */
interface TurboZapInstanceStatus {
	status: "disconnected" | "connecting" | "qrcode" | "connected" | "error";
	phone_number?: string;
	profile_name?: string;
	profile_pic?: string;
	device_jid?: string;
}

/**
 * QR code response from TurboZap.
 */
interface TurboZapQRCode {
	qr_code: string;
	status: string;
}

/**
 * Message send response from TurboZap.
 */
interface TurboZapMessageResult {
	message_id: string;
	status: string;
	timestamp: string;
}

/**
 * Instance create response from TurboZap.
 */
interface TurboZapInstanceCreate {
	id: string;
	name: string;
	status: string;
	created_at?: string;
}

/**
 * Group info from TurboZap.
 */
interface TurboZapGroup {
	id: string;
	name: string;
	participants_count: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HTTP client for TurboZap API.
 */
export class TurboZapClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;
	private readonly timeoutMs: number;

	constructor(config: ProviderConfig) {
		this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
		this.apiKey = config.apiKey;
		this.timeoutMs = config.timeoutMs ?? 30000;
	}

	// ─────────────────────────────────────────────────────────────────────────
	// INSTANCE MANAGEMENT
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Connects an instance (initiates QR code flow).
	 */
	async connect(
		instanceName: string,
	): Promise<TurboZapResponse<TurboZapQRCode>> {
		return this.post<TurboZapQRCode>(`/instance/${instanceName}/connect`);
	}

	/**
	 * Creates a new instance.
	 */
	async createInstance(
		instanceName: string,
	): Promise<TurboZapResponse<TurboZapInstanceCreate>> {
		return this.post<TurboZapInstanceCreate>("/instance/create", {
			name: instanceName,
		});
	}

	/**
	 * Disconnects an instance.
	 */
	async logout(instanceName: string): Promise<TurboZapResponse<unknown>> {
		return this.post(`/instance/${instanceName}/logout`);
	}

	/**
	 * Gets instance status.
	 */
	async getStatus(
		instanceName: string,
	): Promise<TurboZapResponse<TurboZapInstanceStatus>> {
		return this.get<TurboZapInstanceStatus>(`/instance/${instanceName}/status`);
	}

	/**
	 * Gets QR code for connection.
	 */
	async getQRCode(
		instanceName: string,
	): Promise<TurboZapResponse<{ qr_code: string }>> {
		return this.get<{ qr_code: string }>(`/instance/${instanceName}/qrcode`);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// MESSAGING
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Sends a text message.
	 */
	async sendText(
		instanceName: string,
		to: string,
		text: string,
	): Promise<TurboZapResponse<TurboZapMessageResult>> {
		return this.post<TurboZapMessageResult>(`/message/${instanceName}/text`, {
			to,
			text,
		});
	}

	/**
	 * Sends a media message.
	 */
	async sendMedia(
		instanceName: string,
		params: {
			to: string;
			media_url?: string;
			base64?: string;
			caption?: string;
			mime_type?: string;
		},
	): Promise<TurboZapResponse<TurboZapMessageResult>> {
		return this.post<TurboZapMessageResult>(
			`/message/${instanceName}/media`,
			params,
		);
	}

	/**
	 * Sends an audio message.
	 */
	async sendAudio(
		instanceName: string,
		params: {
			to: string;
			media_url?: string;
			base64?: string;
			ptt?: boolean;
		},
	): Promise<TurboZapResponse<TurboZapMessageResult>> {
		return this.post<TurboZapMessageResult>(
			`/message/${instanceName}/audio`,
			params,
		);
	}

	/**
	 * Sends a reaction to a message.
	 */
	async sendReaction(
		instanceName: string,
		to: string,
		messageId: string,
		reaction: string,
	): Promise<TurboZapResponse<TurboZapMessageResult>> {
		return this.post<TurboZapMessageResult>(
			`/message/${instanceName}/reaction`,
			{
				to,
				message_id: messageId,
				reaction,
			},
		);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// PRESENCE
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Sets presence status.
	 */
	async setPresence(
		instanceName: string,
		to: string,
		presence: "available" | "unavailable" | "composing" | "recording",
	): Promise<TurboZapResponse<unknown>> {
		return this.post(`/presence/${instanceName}/available`, {
			to,
			presence,
		});
	}

	// ─────────────────────────────────────────────────────────────────────────
	// GROUPS
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Lists groups for an instance.
	 */
	async listGroups(
		instanceName: string,
	): Promise<TurboZapResponse<{ groups: TurboZapGroup[] }>> {
		return this.get<{ groups: TurboZapGroup[] }>(`/group/${instanceName}/list`);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// HTTP HELPERS
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Makes a GET request to the TurboZap API.
	 */
	private async get<T>(path: string): Promise<TurboZapResponse<T>> {
		return this.request<T>("GET", path);
	}

	/**
	 * Makes a POST request to the TurboZap API.
	 */
	private async post<T>(
		path: string,
		body?: unknown,
	): Promise<TurboZapResponse<T>> {
		return this.request<T>("POST", path, body);
	}

	/**
	 * Makes an HTTP request to the TurboZap API.
	 */
	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
	): Promise<TurboZapResponse<T>> {
		const url = `${this.baseUrl}${path}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					"X-API-Key": this.apiKey,
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const contentType = response.headers.get("content-type") ?? "";
			if (!contentType.includes("application/json")) {
				const bodyText = await response.text().catch(() => "");
				return {
					success: false,
					error: {
						code: `HTTP_${response.status}`,
						message: bodyText
							? `Unexpected response: ${bodyText.substring(0, 120)}`
							: "Unexpected non-JSON response from TurboZap",
					},
				};
			}

			let data: TurboZapResponse<T>;
			try {
				data = (await response.json()) as TurboZapResponse<T>;
			} catch (error) {
				return {
					success: false,
					error: {
						code: "PARSE_ERROR",
						message:
							error instanceof Error
								? error.message
								: "Failed to parse TurboZap response",
					},
				};
			}

			if (!response.ok) {
				return {
					success: false,
					error: data.error ?? {
						code: `HTTP_${response.status}`,
						message: response.statusText,
					},
				};
			}

			return data;
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof Error && error.name === "AbortError") {
				return {
					success: false,
					error: {
						code: "TIMEOUT",
						message: `Request timed out after ${this.timeoutMs}ms`,
					},
				};
			}

			return {
				success: false,
				error: {
					code: "NETWORK_ERROR",
					message: error instanceof Error ? error.message : "Unknown error",
				},
			};
		}
	}
}

// Export types for use in provider
export type {
	TurboZapGroup, TurboZapInstanceStatus,
	TurboZapMessageResult, TurboZapResponse
};


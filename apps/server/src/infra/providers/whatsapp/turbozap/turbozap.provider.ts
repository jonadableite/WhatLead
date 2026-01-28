/**
 * TurboZap Provider Implementation
 *
 * Implements WhatsAppProvider interface using the TurboZap/WhatsMeow API.
 * This provider supports all capabilities (presence, reactions, audio, groups).
 *
 * DESIGN:
 * - Provider is "dumb" - no business logic, no retry, no rate limiting
 * - All error translation happens here (TurboZap errors → domain errors)
 * - Maps interface methods to TurboZap API endpoints
 */

import type {
    ConnectionResult,
    GroupInfo,
    InstanceStatusInfo,
    MarkAsReadParams,
    MessageResult,
    ProviderConfig,
    QRCodeResult,
    SendAudioParams,
    SendMediaParams,
    SendReactionParams,
    SendTextParams,
    SetPresenceParams,
} from "../../../../application/providers/types";
import type {
    WhatsAppAudioCapable,
    WhatsAppGroupCapable,
    WhatsAppPresenceCapable,
    WhatsAppProvider,
    WhatsAppReactionCapable,
} from "../../../../application/providers/whatsapp-provider";
import type { InstanceConnectionStatus } from "../../../../domain/value-objects/instance-connection-status";
import { TurboZapClient } from "./turbozap.client";

// ═══════════════════════════════════════════════════════════════════════════
// STATUS MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps TurboZap status strings to domain InstanceStatus.
 */
const mapTurboZapStatus = (
	status: string,
): InstanceConnectionStatus => {
	switch (status) {
		case "connected":
			return "CONNECTED";
		case "connecting":
			return "CONNECTING";
		case "qrcode":
			return "QRCODE";
		case "error":
			return "ERROR";
		case "disconnected":
		default:
			return "DISCONNECTED";
	}
};

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * TurboZap WhatsApp Provider.
 *
 * Implements all capability interfaces:
 * - WhatsAppProvider (core)
 * - WhatsAppPresenceCapable
 * - WhatsAppReactionCapable
 * - WhatsAppAudioCapable
 * - WhatsAppGroupCapable
 */
export class TurboZapProvider
	implements
		WhatsAppProvider,
		WhatsAppPresenceCapable,
		WhatsAppReactionCapable,
		WhatsAppAudioCapable,
		WhatsAppGroupCapable
{
	readonly providerName = "TurboZap";
	private readonly client: TurboZapClient;

	constructor(config: ProviderConfig) {
		this.client = new TurboZapClient(config);
	}

	private isInstanceMissing(error?: { code?: string; message?: string }): boolean {
		if (!error) return false;
		if (error.code === "HTTP_404") return true;
		const message = error.message?.toLowerCase() ?? "";
		return message.includes("not found") || message.includes("instance");
	}

	private async ensureInstanceExists(
		instanceName: string,
	): Promise<{ ok: boolean; error?: string }> {
		const status = await this.client.getStatus(instanceName);
		if (status.success) return { ok: true };
		if (!this.isInstanceMissing(status.error)) {
			return {
				ok: false,
				error: status.error?.message ?? "Failed to validate instance on provider",
			};
		}

		const created = await this.client.createInstance(instanceName);
		if (created.success) return { ok: true };
		if (created.error?.code === "HTTP_409") return { ok: true };

		return {
			ok: false,
			error: created.error?.message ?? "Failed to create instance on provider",
		};
	}

	// ─────────────────────────────────────────────────────────────────────────
	// CONNECTION MANAGEMENT
	// ─────────────────────────────────────────────────────────────────────────

	async connect(instanceId: string): Promise<ConnectionResult> {
		const ensured = await this.ensureInstanceExists(instanceId);
		if (!ensured.ok) {
			return {
				success: false,
				status: "ERROR",
				error: ensured.error ?? "Failed to ensure instance on provider",
			};
		}

		const response = await this.client.connect(instanceId);

		if (!response.success) {
			return {
				success: false,
				status: "ERROR",
				error: response.error?.message ?? "Failed to connect",
			};
		}

		return {
			success: true,
			qrCode: response.data?.qr_code,
			status: mapTurboZapStatus(response.data?.status ?? "qrcode"),
		};
	}

	async disconnect(instanceId: string): Promise<void> {
		const response = await this.client.logout(instanceId);

		if (!response.success) {
			throw new Error(response.error?.message ?? "Failed to disconnect");
		}
	}

	async getStatus(instanceId: string): Promise<InstanceStatusInfo> {
		const response = await this.client.getStatus(instanceId);

		if (!response.success || !response.data) {
			return {
				status: "DISCONNECTED",
			};
		}

		return {
			status: mapTurboZapStatus(response.data.status),
			phoneNumber: response.data.phone_number,
			profileName: response.data.profile_name,
			profilePicUrl: response.data.profile_pic,
		};
	}

	async getQRCode(instanceId: string): Promise<QRCodeResult> {
		const ensured = await this.ensureInstanceExists(instanceId);
		if (!ensured.ok) {
			throw new Error(ensured.error ?? "Failed to ensure instance on provider");
		}

		const response = await this.client.getQRCode(instanceId);

		if (!response.success || !response.data) {
			throw new Error("Failed to get QR code");
		}

		return {
			qrCode: response.data.qr_code,
		};
	}

	// ─────────────────────────────────────────────────────────────────────────
	// MESSAGING (Core)
	// ─────────────────────────────────────────────────────────────────────────

	async sendText(params: SendTextParams): Promise<MessageResult> {
		const { instanceId, to, text } = params;

		// Note: delayMs is handled by the caller (HeaterUseCase), not the provider
		const response = await this.client.sendText(instanceId, to, text);

		if (!response.success) {
			return {
				success: false,
				errorCode: response.error?.code,
				error: response.error?.message ?? "Failed to send text",
			};
		}

		return {
			success: true,
			messageId: response.data?.message_id,
			timestamp: response.data?.timestamp
				? new Date(response.data.timestamp)
				: undefined,
		};
	}

	async sendMedia(params: SendMediaParams): Promise<MessageResult> {
		const { instanceId, to, mediaUrl, base64, mimeType, caption } = params;

		const response = await this.client.sendMedia(instanceId, {
			to,
			media_url: mediaUrl,
			base64,
			mime_type: mimeType,
			caption,
		});

		if (!response.success) {
			return {
				success: false,
				errorCode: response.error?.code,
				error: response.error?.message ?? "Failed to send media",
			};
		}

		return {
			success: true,
			messageId: response.data?.message_id,
			timestamp: response.data?.timestamp
				? new Date(response.data.timestamp)
				: undefined,
		};
	}

	// ─────────────────────────────────────────────────────────────────────────
	// PRESENCE (WhatsAppPresenceCapable)
	// ─────────────────────────────────────────────────────────────────────────

	async setPresence(params: SetPresenceParams): Promise<void> {
		const { instanceId, to, presence } = params;

		const response = await this.client.setPresence(instanceId, to, presence);

		if (!response.success) {
			throw new Error(response.error?.message ?? "Failed to set presence");
		}
	}

	async markAsRead(_params: MarkAsReadParams): Promise<void> {
		// TurboZap API doesn't have a direct markAsRead endpoint
		// This would be implemented if the API supports it
		// For now, we just acknowledge the call
		return;
	}

	// ─────────────────────────────────────────────────────────────────────────
	// REACTIONS (WhatsAppReactionCapable)
	// ─────────────────────────────────────────────────────────────────────────

	async sendReaction(params: SendReactionParams): Promise<MessageResult> {
		const { instanceId, to, messageId, emoji } = params;

		const response = await this.client.sendReaction(
			instanceId,
			to,
			messageId,
			emoji,
		);

		if (!response.success) {
			return {
				success: false,
				errorCode: response.error?.code,
				error: response.error?.message ?? "Failed to send reaction",
			};
		}

		return {
			success: true,
			messageId: response.data?.message_id,
			timestamp: response.data?.timestamp
				? new Date(response.data.timestamp)
				: undefined,
		};
	}

	// ─────────────────────────────────────────────────────────────────────────
	// AUDIO (WhatsAppAudioCapable)
	// ─────────────────────────────────────────────────────────────────────────

	async sendAudio(params: SendAudioParams): Promise<MessageResult> {
		const { instanceId, to, mediaUrl, base64, ptt } = params;

		const response = await this.client.sendAudio(instanceId, {
			to,
			media_url: mediaUrl,
			base64,
			ptt,
		});

		if (!response.success) {
			return {
				success: false,
				errorCode: response.error?.code,
				error: response.error?.message ?? "Failed to send audio",
			};
		}

		return {
			success: true,
			messageId: response.data?.message_id,
			timestamp: response.data?.timestamp
				? new Date(response.data.timestamp)
				: undefined,
		};
	}

	// ─────────────────────────────────────────────────────────────────────────
	// GROUPS (WhatsAppGroupCapable)
	// ─────────────────────────────────────────────────────────────────────────

	async listGroups(instanceId: string): Promise<GroupInfo[]> {
		const response = await this.client.listGroups(instanceId);

		if (!response.success || !response.data) {
			return [];
		}

		return response.data.groups.map((group) => ({
			id: group.id,
			name: group.name,
			participantsCount: group.participants_count,
		}));
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

import { registerProvider } from "../../../../application/providers/whatsapp-provider-factory";

/**
 * Registers the TurboZap provider with the factory.
 * Call this during application bootstrap.
 */
export const registerTurboZapProvider = (): void => {
	registerProvider("TURBOZAP", (config) => new TurboZapProvider(config));
};

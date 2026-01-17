import { describe, expect, it, vi } from "vitest";
import { WhatsAppProviderDispatchAdapter } from "./whatsapp-dispatch-adapter";

describe("WhatsAppProviderDispatchAdapter", () => {
	it("maps SEND_TEXT to provider.sendText", async () => {
		const provider = {
			providerName: "Mock",
			connect: vi.fn(),
			disconnect: vi.fn(),
			getStatus: vi.fn(),
			getQRCode: vi.fn(),
			sendText: vi.fn(async () => ({ success: true, messageId: "m-1" })),
			sendMedia: vi.fn(),
		};

		const adapter = new WhatsAppProviderDispatchAdapter(provider as any);
		const result = await adapter.send({
			type: "SEND_TEXT",
			instanceId: "i-1",
			to: "t",
			text: "kkk",
		});

		expect(provider.sendText).toHaveBeenCalledWith({
			instanceId: "i-1",
			to: "t",
			text: "kkk",
			delayMs: undefined,
		});
		expect(result.success).toBe(true);
	});

	it("returns error when SEND_REACTION is requested but provider is not reaction capable", async () => {
		const provider = {
			providerName: "Mock",
			connect: vi.fn(),
			disconnect: vi.fn(),
			getStatus: vi.fn(),
			getQRCode: vi.fn(),
			sendText: vi.fn(),
			sendMedia: vi.fn(),
		};

		const adapter = new WhatsAppProviderDispatchAdapter(provider as any);
		const result = await adapter.send({
			type: "SEND_REACTION",
			instanceId: "i-1",
			to: "t",
			messageId: "m-1",
			emoji: "👍",
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("Provider does not support reactions");
	});

	it("maps MARK_AS_READ when provider is presence capable", async () => {
		const provider = {
			providerName: "Mock",
			connect: vi.fn(),
			disconnect: vi.fn(),
			getStatus: vi.fn(),
			getQRCode: vi.fn(),
			sendText: vi.fn(),
			sendMedia: vi.fn(),
			setPresence: vi.fn(async () => {}),
			markAsRead: vi.fn(async () => {}),
		};

		const adapter = new WhatsAppProviderDispatchAdapter(provider as any);
		const result = await adapter.send({
			type: "MARK_AS_READ",
			instanceId: "i-1",
			messageId: "m-1",
		});

		expect(provider.markAsRead).toHaveBeenCalledWith({
			instanceId: "i-1",
			messageId: "m-1",
		});
		expect(result.success).toBe(true);
	});
});


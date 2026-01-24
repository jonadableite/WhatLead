export interface WhatsAppProviderPort {
	sendText(params: { instanceId: string; to: string; text: string }): Promise<void>;
	sendMedia(params: {
		instanceId: string;
		to: string;
		url: string;
		mimeType: string;
		caption?: string;
	}): Promise<void>;
	sendAudio(params: { instanceId: string; to: string; url: string }): Promise<void>;
	sendReaction(params: {
		instanceId: string;
		to: string;
		messageRef: string;
		emoji: string;
	}): Promise<void>;
}


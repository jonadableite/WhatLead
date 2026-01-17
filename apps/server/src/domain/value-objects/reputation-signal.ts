export const REPUTATION_SIGNAL_TYPES = [
	"MESSAGE_SENT",
	"MESSAGE_DELIVERED",
	"MESSAGE_READ",
	"MESSAGE_REPLIED",
	"MESSAGE_FAILED",
	"CONNECTION_CONNECTED",
	"CONNECTION_DISCONNECTED",
	"CONNECTION_ERROR",
] as const;

export type ReputationSignalType = (typeof REPUTATION_SIGNAL_TYPES)[number];

export interface ReputationSignal {
	readonly type: ReputationSignalType;
	readonly instanceId: string;
	readonly occurredAt: Date;
	readonly messageId?: string;
	readonly remoteJid?: string;
	readonly isGroup?: boolean;
	readonly latencyMs?: number;
}


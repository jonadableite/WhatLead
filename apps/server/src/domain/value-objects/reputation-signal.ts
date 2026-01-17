export const REPUTATION_SIGNAL_TYPES = [
	"MESSAGE_SENT",
	"MESSAGE_DELIVERED",
	"MESSAGE_READ",
	"MESSAGE_REPLIED",
	"MESSAGE_FAILED",
	"REACTION_SENT",
	"PRESENCE_SET",
	"SEND_LATENCY_OBSERVED",
	"RATE_LIMIT_HIT",
	"QRCODE_REGENERATED",
	"CONNECTION_CONNECTED",
	"CONNECTION_DISCONNECTED",
	"CONNECTION_ERROR",
] as const;

export type ReputationSignalType = (typeof REPUTATION_SIGNAL_TYPES)[number];

export const REPUTATION_SIGNAL_SEVERITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type ReputationSignalSeverity =
	(typeof REPUTATION_SIGNAL_SEVERITIES)[number];

export const REPUTATION_SIGNAL_SOURCES = ["WEBHOOK", "DISPATCH", "PROVIDER"] as const;
export type ReputationSignalSource = (typeof REPUTATION_SIGNAL_SOURCES)[number];

export interface ReputationSignal {
	readonly type: ReputationSignalType;
	readonly severity: ReputationSignalSeverity;
	readonly source: ReputationSignalSource;
	readonly instanceId: string;
	readonly occurredAt: Date;
	readonly messageId?: string;
	readonly remoteJid?: string;
	readonly isGroup?: boolean;
	readonly latencyMs?: number;
	readonly context: Record<string, unknown>;
}

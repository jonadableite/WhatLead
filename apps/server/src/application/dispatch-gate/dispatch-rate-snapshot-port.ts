export interface DispatchRateSnapshot {
	sentLastMinute: number;
	sentLastHour: number;
	lastMessageAt: Date | null;
	oldestMessageAtLastHour: Date | null;
	recentTextSignatures: readonly string[];
}

export interface DispatchRateSnapshotPort {
	getSnapshot(params: {
		instanceId: string;
		now: Date;
	}): Promise<DispatchRateSnapshot>;
}

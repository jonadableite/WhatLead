import type { ReputationSignal } from "../value-objects/reputation-signal";

export interface ReputationSignalRepository {
	append(signal: ReputationSignal): Promise<void>;
	getWindow(params: {
		instanceId: string;
		since: Date;
		until: Date;
	}): Promise<readonly ReputationSignal[]>;
}


import type { ReputationSignalRepository } from "../../domain/repositories/reputation-signal-repository";
import type { ReputationSignal } from "../../domain/value-objects/reputation-signal";

export class InMemoryReputationSignalRepository
	implements ReputationSignalRepository
{
	private readonly byInstanceId = new Map<string, ReputationSignal[]>();

	async append(signal: ReputationSignal): Promise<void> {
		const list = this.byInstanceId.get(signal.instanceId) ?? [];
		list.push(signal);
		this.byInstanceId.set(signal.instanceId, list);
	}

	async getWindow(params: {
		instanceId: string;
		since: Date;
		until: Date;
	}): Promise<readonly ReputationSignal[]> {
		const list = this.byInstanceId.get(params.instanceId) ?? [];
		return list.filter(
			(s) =>
				s.occurredAt.getTime() >= params.since.getTime() &&
				s.occurredAt.getTime() <= params.until.getTime(),
		);
	}
}


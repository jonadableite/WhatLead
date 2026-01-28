import type { InstanceRepository } from "../../domain/repositories/instance-repository";
import type { WhatsAppProvider } from "../providers/whatsapp-provider";
import {
	toInstanceListItemViewModel,
	type InstanceListItemViewModel,
} from "./instance-view-model";
import { getProviderInstanceName } from "./provider-instance-name";

export interface ListInstancesUseCaseRequest {
	companyId: string;
	now?: Date;
}

export interface ListInstancesUseCaseResponse {
	items: InstanceListItemViewModel[];
}

export class ListInstancesUseCase {
	constructor(
		private readonly instances: InstanceRepository,
		private readonly provider: WhatsAppProvider,
	) {}

	async execute(
		request: ListInstancesUseCaseRequest,
	): Promise<ListInstancesUseCaseResponse> {
		const now = request.now ?? new Date();
		const instances = await this.instances.listByCompanyId(request.companyId);
		const updated = await Promise.all(
			instances.map(async (instance) => {
				if (shouldSyncProfile(instance.profileLastSyncAt, now)) {
					try {
						const providerName = getProviderInstanceName(instance);
						const status = await this.provider.getStatus(providerName);
						instance.updateWhatsAppProfile({
							name: status.profileName ?? null,
							picUrl: status.profilePicUrl ?? null,
							syncedAt: now,
						});
						await this.instances.save(instance);
					} catch {
						// Ignore provider errors during list; stale profile will remain.
					}
				}
				return instance;
			}),
		);

		return { items: updated.map((i) => toInstanceListItemViewModel(i, now)) };
	}
}

const shouldSyncProfile = (lastSyncAt: Date | null, now: Date): boolean => {
	if (!lastSyncAt) return true;
	const diffMs = now.getTime() - lastSyncAt.getTime();
	return diffMs >= 60 * 60 * 1000;
};


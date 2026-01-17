import type { Agent } from "../entities/agent";

export interface AgentRepository {
	listOnlineByOrganization(params: { organizationId: string }): Promise<readonly Agent[]>;
}


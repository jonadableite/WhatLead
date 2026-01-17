import type { Agent } from "../../domain/entities/agent";
import type { AgentRepository } from "../../domain/repositories/agent-repository";

export class InMemoryAgentRepository implements AgentRepository {
	private readonly agents: Agent[];

	constructor(agents: Agent[] = []) {
		this.agents = agents;
	}

	async listOnlineByOrganization(params: {
		organizationId: string;
	}): Promise<readonly Agent[]> {
		return this.agents.filter(
			(a) => a.organizationId === params.organizationId && a.status === "ONLINE",
		);
	}
}


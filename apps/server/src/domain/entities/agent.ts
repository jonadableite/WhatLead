import type { AgentRole } from "../value-objects/agent-role";
import type { AgentStatus } from "../value-objects/agent-status";

export interface AgentProps {
	id: string;
	organizationId: string;
	role: AgentRole;
	status: AgentStatus;
}

export class Agent {
	private readonly _id: string;
	private readonly _organizationId: string;
	private readonly _role: AgentRole;
	private _status: AgentStatus;

	private constructor(props: AgentProps) {
		this._id = props.id;
		this._organizationId = props.organizationId;
		this._role = props.role;
		this._status = props.status;
	}

	static create(props: AgentProps): Agent {
		return new Agent(props);
	}

	static reconstitute(props: AgentProps): Agent {
		return new Agent(props);
	}

	get id(): string {
		return this._id;
	}

	get organizationId(): string {
		return this._organizationId;
	}

	get role(): AgentRole {
		return this._role;
	}

	get status(): AgentStatus {
		return this._status;
	}

	setOnline(): void {
		this._status = "ONLINE";
	}

	setOffline(): void {
		this._status = "OFFLINE";
	}
}


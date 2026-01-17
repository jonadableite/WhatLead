import type { AgentRole } from "../value-objects/agent-role";
import type { AgentStatus } from "../value-objects/agent-status";
import type { ConversationStage } from "../value-objects/conversation-stage";
import type { AgentPurpose } from "../value-objects/agent-purpose";
import type { AgentTone } from "../value-objects/agent-tone";

export interface AgentProps {
	id: string;
	organizationId: string;
	role: AgentRole;
	status: AgentStatus;
	purpose?: AgentPurpose;
	allowedStages?: readonly ConversationStage[];
	tone?: AgentTone;
	maxDailyInteractions?: number;
	channelBindings?: readonly string[];
}

export class Agent {
	private readonly _id: string;
	private readonly _organizationId: string;
	private readonly _role: AgentRole;
	private readonly _purpose: AgentPurpose;
	private readonly _allowedStages: readonly ConversationStage[];
	private readonly _tone: AgentTone;
	private readonly _maxDailyInteractions: number | null;
	private readonly _channelBindings: readonly string[];
	private _status: AgentStatus;

	private constructor(props: AgentProps) {
		this._id = props.id;
		this._organizationId = props.organizationId;
		this._role = props.role;
		this._purpose = props.purpose ?? "SDR";
		this._allowedStages = props.allowedStages ?? [];
		this._tone = props.tone ?? "NEUTRAL";
		this._maxDailyInteractions = props.maxDailyInteractions ?? null;
		this._channelBindings = props.channelBindings ?? [];
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

	get purpose(): AgentPurpose {
		return this._purpose;
	}

	get allowedStages(): readonly ConversationStage[] {
		return this._allowedStages;
	}

	get tone(): AgentTone {
		return this._tone;
	}

	get maxDailyInteractions(): number | null {
		return this._maxDailyInteractions;
	}

	get channelBindings(): readonly string[] {
		return this._channelBindings;
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

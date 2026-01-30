import type { LeadStage } from "../value-objects/lead-stage";

export interface LeadProps {
	id: string;
	tenantId: string;
	campaignId: string | null;
	name: string;
	email: string;
	phone: string;
	profilePicUrl?: string | null;
	lid?: string | null;
	stage: LeadStage;
	createdAt: Date;
}

export class Lead {
	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _campaignId: string | null;
	private _name: string;
	private _email: string;
	private _phone: string;
	private _profilePicUrl: string | null;
	private _lid: string | null;
	private _stage: LeadStage;
	private readonly _createdAt: Date;

	private constructor(props: LeadProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._campaignId = props.campaignId;
		this._name = props.name;
		this._email = props.email;
		this._phone = props.phone;
		this._profilePicUrl = props.profilePicUrl ?? null;
		this._lid = props.lid ?? null;
		this._stage = props.stage;
		this._createdAt = props.createdAt;
	}

	static create(props: Omit<LeadProps, "createdAt"> & { createdAt?: Date }): Lead {
		return new Lead({ ...props, createdAt: props.createdAt ?? new Date() });
	}

	static reconstitute(props: LeadProps): Lead {
		return new Lead(props);
	}

	get id(): string {
		return this._id;
	}

	get tenantId(): string {
		return this._tenantId;
	}

	get campaignId(): string | null {
		return this._campaignId;
	}

	get name(): string {
		return this._name;
	}

	get email(): string {
		return this._email;
	}

	get phone(): string {
		return this._phone;
	}

	get profilePicUrl(): string | null {
		return this._profilePicUrl;
	}

	get lid(): string | null {
		return this._lid;
	}

	get stage(): LeadStage {
		return this._stage;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	updateIdentity(params: { name?: string; email?: string; phone?: string; lid?: string | null }): void {
		if (typeof params.name === "string" && params.name.trim()) {
			this._name = params.name.trim();
		}
		if (typeof params.email === "string" && params.email.trim()) {
			this._email = params.email.trim();
		}
		if (typeof params.phone === "string" && params.phone.trim()) {
			this._phone = params.phone.trim();
		}
		if (typeof params.lid === "string" && params.lid.trim()) {
			this._lid = params.lid.trim();
		}
	}

	updateProfilePicture(url: string): void {
		const trimmed = url.trim();
		if (!trimmed) return;
		this._profilePicUrl = trimmed;
	}

	changeStage(nextStage: LeadStage): void {
		this._stage = nextStage;
	}
}

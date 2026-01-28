import type { InstanceDomainEvent } from "../events/instance-events";
import type { InstanceConnectionStatus } from "../value-objects/instance-connection-status";
import type { InstanceHealthAction } from "../value-objects/instance-health-action";
import type { InstanceHealthEvaluationReason } from "../value-objects/instance-health-evaluation-reason";
import type { InstanceLifecycleStatus } from "../value-objects/instance-lifecycle-status";
import type { InstancePurpose } from "../value-objects/instance-purpose";
import type { WhatsAppEngine } from "../value-objects/whatsapp-engine";
import type { InstanceReputation } from "./instance-reputation";

export interface InstanceProps {
	id: string;
	companyId: string;
	engine: WhatsAppEngine;
	purpose: InstancePurpose;
	displayName: string;
	phoneNumber: string;
	profileName?: string | null;
	profilePicUrl?: string | null;
	profileLastSyncAt?: Date | null;
	lifecycleStatus: InstanceLifecycleStatus;
	connectionStatus: InstanceConnectionStatus;
	reputation: InstanceReputation;
	activeCampaignIds: string[];
	createdAt: Date;
	lastConnectedAt: Date | null;
}

export class Instance {
	private readonly _id: string;
	private readonly _companyId: string;
	private readonly _engine: WhatsAppEngine;

	private _purpose: InstancePurpose;
	private _displayName: string;
	private _phoneNumber: string;
	private _profileName: string | null;
	private _profilePicUrl: string | null;
	private _profileLastSyncAt: Date | null;
	private _lifecycleStatus: InstanceLifecycleStatus;
	private _connectionStatus: InstanceConnectionStatus;
	private _reputation: InstanceReputation;
	private _activeCampaignIds: string[];
	private _lastConnectedAt: Date | null;
	private readonly _createdAt: Date;

	private constructor(props: InstanceProps) {
		this._id = props.id;
		this._companyId = props.companyId;
		this._engine = props.engine;
		this._purpose = props.purpose;
		this._displayName = props.displayName;
		this._phoneNumber = props.phoneNumber;
		this._profileName = props.profileName ?? null;
		this._profilePicUrl = props.profilePicUrl ?? null;
		this._profileLastSyncAt = props.profileLastSyncAt ?? null;
		this._lifecycleStatus = props.lifecycleStatus;
		this._connectionStatus = props.connectionStatus;
		this._reputation = props.reputation;
		this._activeCampaignIds = [...props.activeCampaignIds];
		this._createdAt = props.createdAt;
		this._lastConnectedAt = props.lastConnectedAt;
	}

	static initialize(params: {
		id: string;
		companyId: string;
		engine: WhatsAppEngine;
		reputation: InstanceReputation;
		purpose?: InstancePurpose;
		displayName?: string;
		phoneNumber?: string;
	}): Instance {
		return new Instance({
			id: params.id,
			companyId: params.companyId,
			engine: params.engine,
			purpose: params.purpose ?? "WARMUP",
			displayName: params.displayName ?? "Nova instância",
			phoneNumber: params.phoneNumber ?? "",
			profileName: null,
			profilePicUrl: null,
			profileLastSyncAt: null,
			lifecycleStatus: "CREATED",
			connectionStatus: "DISCONNECTED",
			reputation: params.reputation,
			activeCampaignIds: [],
			createdAt: new Date(),
			lastConnectedAt: null,
		});
	}

	static reconstitute(props: InstanceProps): Instance {
		return new Instance(props);
	}

	get id(): string {
		return this._id;
	}

	get companyId(): string {
		return this._companyId;
	}

	get engine(): WhatsAppEngine {
		return this._engine;
	}

	get lifecycleStatus(): InstanceLifecycleStatus {
		return this._lifecycleStatus;
	}

	get connectionStatus(): InstanceConnectionStatus {
		return this._connectionStatus;
	}

	get purpose(): InstancePurpose {
		return this._purpose;
	}

	get displayName(): string {
		return this._displayName;
	}

	get phoneNumber(): string {
		return this._phoneNumber;
	}

	get profileName(): string | null {
		return this._profileName;
	}

	get profilePicUrl(): string | null {
		return this._profilePicUrl;
	}

	get profileLastSyncAt(): Date | null {
		return this._profileLastSyncAt;
	}

	get maskedPhoneNumber(): string {
		return maskPhoneNumber(this._phoneNumber);
	}

	get reputation(): InstanceReputation {
		return this._reputation;
	}

	get activeCampaignIds(): string[] {
		return [...this._activeCampaignIds];
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get lastConnectedAt(): Date | null {
		return this._lastConnectedAt;
	}

	updateWhatsAppProfile(params: {
		name?: string | null;
		picUrl?: string | null;
		syncedAt?: Date | null;
	}): void {
		if (typeof params.name !== "undefined") {
			this._profileName = params.name;
		}
		if (typeof params.picUrl !== "undefined") {
			this._profilePicUrl = params.picUrl;
		}
		if (typeof params.syncedAt !== "undefined") {
			this._profileLastSyncAt = params.syncedAt;
		}
	}

	markConnecting(): void {
		if (this._lifecycleStatus === "BANNED") {
			return;
		}
		this._connectionStatus = "CONNECTING";
	}

	markConnected(): void {
		if (this._lifecycleStatus === "BANNED") {
			return;
		}
		this._connectionStatus = "CONNECTED";
		this._lastConnectedAt = new Date();

		if (this._lifecycleStatus === "CREATED") {
			this._lifecycleStatus = "ACTIVE";
		}
	}

	markDisconnected(): void {
		if (this._lifecycleStatus === "BANNED") {
			return;
		}
		this._connectionStatus = "DISCONNECTED";
	}

	markQRCode(): void {
		if (this._lifecycleStatus === "BANNED") {
			return;
		}
		this._connectionStatus = "QRCODE";
	}

	markError(): void {
		if (this._lifecycleStatus === "BANNED") {
			return;
		}
		this._connectionStatus = "ERROR";
	}

	markBanned(): void {
		this._lifecycleStatus = "BANNED";
		this._connectionStatus = "DISCONNECTED";
	}

	enterCooldown(): void {
		if (this._lifecycleStatus === "BANNED") {
			return;
		}
		this._lifecycleStatus = "COOLDOWN";
	}

	exitCooldown(): void {
		if (this._lifecycleStatus === "COOLDOWN") {
			this._lifecycleStatus = "ACTIVE";
		}
	}

	attachCampaign(campaignId: string): void {
		if (this._activeCampaignIds.includes(campaignId)) {
			return;
		}
		this._activeCampaignIds.push(campaignId);
	}

	detachCampaign(campaignId: string): void {
		this._activeCampaignIds = this._activeCampaignIds.filter(
			(id) => id !== campaignId,
		);
	}

	updateReputation(reputation: InstanceReputation): void {
		this._reputation = reputation;
	}

	canWarmUp(): boolean {
		if (this._lifecycleStatus !== "ACTIVE") {
			return false;
		}
		if (this._connectionStatus !== "CONNECTED") {
			return false;
		}
		return this._purpose !== "DISPATCH";
	}

	canDispatch(now: Date = new Date()): boolean {
		if (this._lifecycleStatus !== "ACTIVE") {
			return false;
		}
		if (this._connectionStatus !== "CONNECTED") {
			return false;
		}
		return this._reputation.canDispatch(now);
	}

	isAtRisk(): boolean {
		return this._reputation.isAtRisk();
	}

	requiresCooldown(): boolean {
		return this._reputation.requiresCooldown();
	}

	allowedActions(now: Date = new Date()): readonly InstanceHealthAction[] {
		const actions: InstanceHealthAction[] = [];

		actions.push("VIEW_HEALTH");

		if (this._lifecycleStatus === "BANNED") {
			return ["VIEW_HEALTH", "BLOCK_DISPATCH", "ALERT"];
		}

		if (this._connectionStatus === "DISCONNECTED") {
			actions.push("CONNECT");
		}
		if (this._connectionStatus === "ERROR") {
			actions.push("RECONNECT");
		}

		if (this._lifecycleStatus === "COOLDOWN") {
			return [...actions, "ENTER_COOLDOWN", "BLOCK_DISPATCH", "ALERT"];
		}

		if (this.isAtRisk()) {
			actions.push("ALERT");
		}

		if (this.canDispatch(now)) {
			actions.push("ALLOW_DISPATCH");
		} else {
			actions.push("BLOCK_DISPATCH");
		}

		return actions;
	}

	evaluateHealth(params: {
		reason: InstanceHealthEvaluationReason;
		now?: Date;
	}): { actions: readonly InstanceHealthAction[]; events: readonly InstanceDomainEvent[] } {
		const now = params.now ?? new Date();
		const events: InstanceDomainEvent[] = [];

		if (this._lifecycleStatus === "BANNED") {
			return { actions: this.allowedActions(now), events };
		}

		if (this.requiresCooldown() && this._lifecycleStatus !== "COOLDOWN") {
			this.enterCooldown();
			events.push({
				type: "InstanceEnteredCooldown",
				occurredAt: now,
				instanceId: this._id,
				companyId: this._companyId,
				reason: params.reason,
			});
		}

		if (
			this._lifecycleStatus === "COOLDOWN" &&
			!this.requiresCooldown() &&
			!this.isAtRisk()
		) {
			this.exitCooldown();
			events.push({
				type: "InstanceRecovered",
				occurredAt: now,
				instanceId: this._id,
				companyId: this._companyId,
				reason: params.reason,
			});
		}

		if (this.isAtRisk()) {
			events.push({
				type: "InstanceAtRisk",
				occurredAt: now,
				instanceId: this._id,
				companyId: this._companyId,
				reason: params.reason,
			});
		}

		return { actions: this.allowedActions(now), events };
	}
}

const maskPhoneNumber = (phoneNumber: string): string => {
	const digits = phoneNumber.replace(/[^\d]/g, "");
	if (!digits) return "—";
	const last4 = digits.slice(-4);
	return `•••• •••• ${last4}`;
};

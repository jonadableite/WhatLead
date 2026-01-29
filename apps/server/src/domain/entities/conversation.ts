import type { ConversationChannel } from "../value-objects/conversation-channel";
import { ConversationSLA } from "../value-objects/conversation-sla";
import type { ConversationStage } from "../value-objects/conversation-stage";
import type { ConversationStatus } from "../value-objects/conversation-status";
import type { MessageDirection } from "../value-objects/message-direction";
import type { MessageSender } from "../value-objects/message-sender";
import type { MessageType } from "../value-objects/message-type";
import { Message } from "./message";

export interface ConversationProps {
	id: string;
	tenantId: string;
	channel: ConversationChannel;
	instanceId: string;
	contactId: string;
	leadId?: string | null;
	status: ConversationStatus;
	stage: ConversationStage;
	assignedAgentId?: string | null;
	assignedOperatorId?: string | null;
	openedAt: Date;
	lastMessageAt: Date;
	lastInboundAt: Date | null;
	lastOutboundAt: Date | null;
	unreadCount: number;
	metadata: Record<string, unknown>;
	sla: ConversationSLA | null;
	isActive: boolean;
}

export class Conversation {
	private static readonly FIRST_RESPONSE_SLA_MS = 10 * 60 * 1000;
	private static readonly NEXT_RESPONSE_SLA_MS = 30 * 60 * 1000;

	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _channel: ConversationChannel;
	private readonly _instanceId: string;
	private readonly _contactId: string;
	private _leadId: string | null;

	private _status: ConversationStatus;
	private _stage: ConversationStage;
	private _assignedAgentId: string | null;
	private _assignedOperatorId: string | null;
	private _openedAt: Date;
	private _lastMessageAt: Date;
	private _lastInboundAt: Date | null;
	private _lastOutboundAt: Date | null;
	private _unreadCount: number;
	private _metadata: Record<string, unknown>;
	private _sla: ConversationSLA | null;
	private _isActive: boolean;

	private constructor(props: ConversationProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._channel = props.channel;
		this._instanceId = props.instanceId;
		this._contactId = props.contactId;
		this._leadId = props.leadId ?? null;
		this._status = props.status;
		this._stage = props.stage;
		this._assignedAgentId = props.assignedAgentId ?? null;
		this._assignedOperatorId = props.assignedOperatorId ?? null;
		this._openedAt = props.openedAt;
		this._lastMessageAt = props.lastMessageAt;
		this._lastInboundAt = props.lastInboundAt;
		this._lastOutboundAt = props.lastOutboundAt;
		this._unreadCount = props.unreadCount;
		this._metadata = props.metadata;
		this._sla = props.sla;
		this._isActive = props.isActive;
	}

	static open(params: {
		id: string;
		tenantId: string;
		channel: ConversationChannel;
		instanceId: string;
		contactId: string;
		openedAt: Date;
	}): Conversation {
		return new Conversation({
			id: params.id,
			tenantId: params.tenantId,
			channel: params.channel,
			instanceId: params.instanceId,
			contactId: params.contactId,
			leadId: null,
			status: "OPEN",
			stage: "LEAD",
			assignedAgentId: null,
			assignedOperatorId: null,
			openedAt: params.openedAt,
			lastMessageAt: params.openedAt,
			lastInboundAt: null,
			lastOutboundAt: null,
			unreadCount: 0,
			metadata: {},
			sla: null,
			isActive: true,
		});
	}

	static reconstitute(props: ConversationProps): Conversation {
		return new Conversation(props);
	}

	get id(): string {
		return this._id;
	}

	get tenantId(): string {
		return this._tenantId;
	}

	get channel(): ConversationChannel {
		return this._channel;
	}

	get instanceId(): string {
		return this._instanceId;
	}

	get contactId(): string {
		return this._contactId;
	}

	get leadId(): string | null {
		return this._leadId;
	}

	get status(): ConversationStatus {
		return this._status;
	}

	get stage(): ConversationStage {
		return this._stage;
	}

	get assignedAgentId(): string | null {
		return this._assignedAgentId;
	}

	get assignedOperatorId(): string | null {
		return this._assignedOperatorId;
	}

	get openedAt(): Date {
		return this._openedAt;
	}

	get lastMessageAt(): Date {
		return this._lastMessageAt;
	}

	get lastInboundAt(): Date | null {
		return this._lastInboundAt;
	}

	get lastOutboundAt(): Date | null {
		return this._lastOutboundAt;
	}

	get unreadCount(): number {
		return this._unreadCount;
	}

	get metadata(): Record<string, unknown> {
		return this._metadata;
	}

	get sla(): ConversationSLA | null {
		return this._sla;
	}

	get isActive(): boolean {
		return this._isActive;
	}

	assign(agentId: string): void {
		if (!this._isActive) {
			return;
		}
		this._assignedAgentId = agentId;
		this._assignedOperatorId = null;
		this._status = "OPEN";
	}

	assignOperator(operatorId: string): void {
		if (!this._isActive) {
			return;
		}
		this._assignedOperatorId = operatorId;
		this._assignedAgentId = null;
		this._status = "OPEN";
	}

	releaseOperator(): void {
		if (!this._isActive) {
			return;
		}
		this._assignedOperatorId = null;
	}

	clearAssignment(): void {
		if (!this._isActive) {
			return;
		}
		this._assignedAgentId = null;
		this._assignedOperatorId = null;
	}

	linkLead(leadId: string): void {
		if (!leadId.trim()) {
			return;
		}
		this._leadId = leadId.trim();
	}

	markAsWaiting(): void {
		if (!this._isActive) {
			return;
		}
		if (this._assignedAgentId) {
			return;
		}
		this._status = "WAITING";
	}

	advanceStage(nextStage: ConversationStage): void {
		this._stage = nextStage;
		if (nextStage === "LOST") {
			this._status = "LOST";
			this._isActive = false;
			this.clearSLA();
		}
		if (nextStage === "WON") {
			this._status = "CLOSED";
			this._isActive = false;
			this.clearSLA();
		}
	}

	close(params: { now?: Date; lost?: boolean } = {}): void {
		const now = params.now ?? new Date();
		this._status = params.lost ? "LOST" : "CLOSED";
		if (params.lost) {
			this._stage = "LOST";
		}
		this._isActive = false;
		this._lastMessageAt = now;
		this.clearSLA();
	}

	receiveInboundMessage(params: {
		messageId: string;
		type: MessageType;
		providerMessageId?: string;
		contentRef?: string;
		metadata?: Record<string, unknown>;
		occurredAt: Date;
	}): Message {
		this.ensureActive(params.occurredAt);
		this._unreadCount += 1;
		this._lastInboundAt = params.occurredAt;
		this._lastMessageAt = params.occurredAt;
		this.ensureSLA();
		this._sla!.clearBreach();

		if (this._lastOutboundAt === null) {
			this._sla!.startFirstResponse({
				dueAt: new Date(params.occurredAt.getTime() + Conversation.FIRST_RESPONSE_SLA_MS),
			});
		} else {
			this._sla!.startNextResponse({
				dueAt: new Date(params.occurredAt.getTime() + Conversation.NEXT_RESPONSE_SLA_MS),
			});
		}

		if (this._status === "CLOSED" || this._status === "LOST") {
			this._status = "OPEN";
		}

		return this.createMessage({
			messageId: params.messageId,
			direction: "INBOUND",
			type: params.type,
			sentBy: "CONTACT",
			status: "SENT",
			providerMessageId: params.providerMessageId,
			contentRef: params.contentRef,
			metadata: params.metadata,
			occurredAt: params.occurredAt,
		});
	}

	recordOutboundMessage(params: {
		messageId: string;
		type: MessageType;
		sentBy: Exclude<MessageSender, "CONTACT">;
		providerMessageId?: string;
		contentRef?: string;
		metadata?: Record<string, unknown>;
		occurredAt: Date;
	}): Message {
		this.ensureActive(params.occurredAt);
		this._lastOutboundAt = params.occurredAt;
		this._lastMessageAt = params.occurredAt;
		this._unreadCount = 0;
		this.clearSLA();

		return this.createMessage({
			messageId: params.messageId,
			direction: "OUTBOUND",
			type: params.type,
			sentBy: params.sentBy,
			status: "SENT",
			providerMessageId: params.providerMessageId,
			contentRef: params.contentRef,
			metadata: params.metadata,
			occurredAt: params.occurredAt,
		});
	}

	recordPendingOutboundMessage(params: {
		messageId: string;
		type: MessageType;
		sentBy: Exclude<MessageSender, "CONTACT">;
		contentRef?: string;
		metadata?: Record<string, unknown>;
		occurredAt: Date;
	}): Message {
		this.ensureActive(params.occurredAt);
		this._lastOutboundAt = params.occurredAt;
		this._lastMessageAt = params.occurredAt;
		this._unreadCount = 0;
		this.clearSLA();

		return this.createMessage({
			messageId: params.messageId,
			direction: "OUTBOUND",
			type: params.type,
			sentBy: params.sentBy,
			status: "PENDING",
			contentRef: params.contentRef,
			metadata: params.metadata,
			occurredAt: params.occurredAt,
		});
	}

	confirmOutboundMessageSent(params: { occurredAt: Date }): void {
		this.ensureActive(params.occurredAt);
		this._lastOutboundAt = params.occurredAt;
		this._lastMessageAt = params.occurredAt;
		this._unreadCount = 0;
		this.clearSLA();
	}

	private ensureActive(openedAt: Date): void {
		if (this._isActive) {
			return;
		}
		this._isActive = true;
		this._status = "OPEN";
		this._openedAt = openedAt;
		this._unreadCount = 0;
	}

	private ensureSLA(): void {
		if (!this._sla) {
			this._sla = ConversationSLA.empty();
		}
	}

	private clearSLA(): void {
		if (this._sla) {
			this._sla.clear();
		}
		this._sla = null;
	}

	private createMessage(params: {
		messageId: string;
		direction: MessageDirection;
		type: MessageType;
		sentBy: MessageSender;
		status: "PENDING" | "SENT" | "FAILED";
		providerMessageId?: string;
		contentRef?: string;
		metadata?: Record<string, unknown>;
		occurredAt: Date;
	}): Message {
		return Message.create({
			id: params.messageId,
			conversationId: this._id,
			direction: params.direction,
			type: params.type,
			sentBy: params.sentBy,
			status: params.status,
			providerMessageId: params.providerMessageId,
			contentRef: params.contentRef,
			metadata: params.metadata,
			occurredAt: params.occurredAt,
		});
	}
}

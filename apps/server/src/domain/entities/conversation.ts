import type { ConversationChannel } from "../value-objects/conversation-channel";
import type { ConversationStatus } from "../value-objects/conversation-status";
import { Message } from "./message";
import type { MessageType } from "../value-objects/message-type";
import type { MessageDirection } from "../value-objects/message-direction";
import type { MessageSender } from "../value-objects/message-sender";

export interface ConversationProps {
	id: string;
	tenantId: string;
	channel: ConversationChannel;
	instanceId: string;
	contactId: string;
	status: ConversationStatus;
	assignedAgentId?: string | null;
	openedAt: Date;
	lastMessageAt: Date;
	isActive: boolean;
}

export class Conversation {
	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _channel: ConversationChannel;
	private readonly _instanceId: string;
	private readonly _contactId: string;

	private _status: ConversationStatus;
	private _assignedAgentId: string | null;
	private _openedAt: Date;
	private _lastMessageAt: Date;
	private _isActive: boolean;

	private constructor(props: ConversationProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._channel = props.channel;
		this._instanceId = props.instanceId;
		this._contactId = props.contactId;
		this._status = props.status;
		this._assignedAgentId = props.assignedAgentId ?? null;
		this._openedAt = props.openedAt;
		this._lastMessageAt = props.lastMessageAt;
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
			status: "OPEN",
			assignedAgentId: null,
			openedAt: params.openedAt,
			lastMessageAt: params.openedAt,
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

	get status(): ConversationStatus {
		return this._status;
	}

	get assignedAgentId(): string | null {
		return this._assignedAgentId;
	}

	get openedAt(): Date {
		return this._openedAt;
	}

	get lastMessageAt(): Date {
		return this._lastMessageAt;
	}

	get isActive(): boolean {
		return this._isActive;
	}

	assign(agentId: string): void {
		if (!this._isActive) {
			return;
		}
		this._assignedAgentId = agentId;
		this._status = "ASSIGNED";
	}

	close(now: Date = new Date()): void {
		this._status = "CLOSED";
		this._isActive = false;
		this._lastMessageAt = now;
	}

	appendMessage(params: {
		messageId: string;
		direction: MessageDirection;
		type: MessageType;
		sentBy: MessageSender;
		providerMessageId?: string;
		contentRef?: string;
		metadata?: Record<string, unknown>;
		occurredAt: Date;
	}): Message {
		if (!this._isActive) {
			this._isActive = true;
			this._status = "OPEN";
			this._openedAt = params.occurredAt;
		}

		this._lastMessageAt = params.occurredAt;
		return Message.create({
			id: params.messageId,
			conversationId: this._id,
			direction: params.direction,
			type: params.type,
			sentBy: params.sentBy,
			providerMessageId: params.providerMessageId,
			contentRef: params.contentRef,
			metadata: params.metadata,
			occurredAt: params.occurredAt,
		});
	}
}


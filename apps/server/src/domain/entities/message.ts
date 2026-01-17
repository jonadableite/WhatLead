import type { MessageDirection } from "../value-objects/message-direction";
import type { MessageSender } from "../value-objects/message-sender";
import type { MessageType } from "../value-objects/message-type";

export interface MessageProps {
	id: string;
	conversationId: string;
	direction: MessageDirection;
	type: MessageType;
	sentBy: MessageSender;
	providerMessageId?: string;
	contentRef?: string;
	metadata?: Record<string, unknown>;
	occurredAt: Date;
}

export class Message {
	private readonly _id: string;
	private readonly _conversationId: string;
	private readonly _direction: MessageDirection;
	private readonly _type: MessageType;
	private readonly _sentBy: MessageSender;
	private readonly _providerMessageId?: string;
	private readonly _contentRef?: string;
	private readonly _metadata: Record<string, unknown>;
	private readonly _occurredAt: Date;

	private constructor(props: MessageProps) {
		this._id = props.id;
		this._conversationId = props.conversationId;
		this._direction = props.direction;
		this._type = props.type;
		this._sentBy = props.sentBy;
		this._providerMessageId = props.providerMessageId;
		this._contentRef = props.contentRef;
		this._metadata = props.metadata ?? {};
		this._occurredAt = props.occurredAt;
	}

	static create(props: MessageProps): Message {
		return new Message(props);
	}

	static reconstitute(props: MessageProps): Message {
		return new Message(props);
	}

	get id(): string {
		return this._id;
	}

	get conversationId(): string {
		return this._conversationId;
	}

	get direction(): MessageDirection {
		return this._direction;
	}

	get type(): MessageType {
		return this._type;
	}

	get sentBy(): MessageSender {
		return this._sentBy;
	}

	get providerMessageId(): string | undefined {
		return this._providerMessageId;
	}

	get contentRef(): string | undefined {
		return this._contentRef;
	}

	get metadata(): Record<string, unknown> {
		return this._metadata;
	}

	get occurredAt(): Date {
		return this._occurredAt;
	}
}


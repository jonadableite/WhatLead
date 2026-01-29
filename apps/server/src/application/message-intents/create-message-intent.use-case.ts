import { MessageIntent } from "../../domain/entities/message-intent";
import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import type { MessageIntentOrigin } from "../../domain/value-objects/message-intent-origin";
import type { MessageIntentPayload } from "../../domain/value-objects/message-intent-payload";
import type { MessageIntentPurpose } from "../../domain/value-objects/message-intent-purpose";
import type { MessageIntentType } from "../../domain/value-objects/message-intent-type";
import type { MessageTarget } from "../../domain/value-objects/message-target";

export interface CreateMessageIntentUseCaseRequest {
	organizationId: string;
	target: MessageTarget;
	type: MessageIntentType;
	purpose: MessageIntentPurpose;
	origin?: MessageIntentOrigin | null;
	payload: MessageIntentPayload;
	now?: Date;
}

export interface CreateMessageIntentUseCaseResponse {
	intentId: string;
	status: "PENDING";
}

export class CreateMessageIntentUseCase {
	constructor(
		private readonly intents: MessageIntentRepository,
		private readonly idFactory: { createId: () => string },
	) {}

	async execute(
		request: CreateMessageIntentUseCaseRequest,
	): Promise<CreateMessageIntentUseCaseResponse> {
		const intent = MessageIntent.create({
			id: this.idFactory.createId(),
			organizationId: request.organizationId,
			target: request.target,
			type: request.type,
			purpose: request.purpose,
			origin: request.origin ?? null,
			payload: request.payload,
			now: request.now,
		});

		await this.intents.create(intent);

		return { intentId: intent.id, status: "PENDING" };
	}
}


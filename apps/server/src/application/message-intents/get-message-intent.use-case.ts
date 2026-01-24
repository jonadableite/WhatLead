import type { MessageIntentRepository } from "../../domain/repositories/message-intent-repository";
import {
	toMessageIntentDetailViewModel,
	type MessageIntentDetailViewModel,
} from "./message-intent-detail-view-model";

export interface GetMessageIntentUseCaseRequest {
	organizationId: string;
	intentId: string;
}

export interface GetMessageIntentUseCaseResponse {
	intent: MessageIntentDetailViewModel;
}

export class GetMessageIntentUseCase {
	constructor(private readonly intents: MessageIntentRepository) {}

	async execute(request: GetMessageIntentUseCaseRequest): Promise<GetMessageIntentUseCaseResponse> {
		const intent = await this.intents.findById(request.intentId);
		if (!intent || intent.organizationId !== request.organizationId) {
			throw new Error("MESSAGE_INTENT_NOT_FOUND");
		}

		return { intent: toMessageIntentDetailViewModel(intent) };
	}
}

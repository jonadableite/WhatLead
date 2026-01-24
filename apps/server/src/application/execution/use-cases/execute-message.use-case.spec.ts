import { describe, expect, it } from "vitest";

import { MessageIntent } from "../../../domain/entities/message-intent";
import type {
	MessageIntentListFilters,
	MessageIntentRepository,
} from "../../../domain/repositories/message-intent-repository";
import type { MessageIntentPurpose } from "../../../domain/value-objects/message-intent-purpose";
import type { MessageIntentStatus } from "../../../domain/value-objects/message-intent-status";
import type { MessageIntentType } from "../../../domain/value-objects/message-intent-type";
import type { MessageTarget } from "../../../domain/value-objects/message-target";
import { ExecutionJob } from "../entities/execution-job";
import type { ExecutionWhatsAppProvider } from "../ports/whatsapp.provider";
import { ExecuteMessageUseCase } from "./execute-message.use-case";

class InMemoryMessageIntentRepository implements MessageIntentRepository {
	private readonly intents = new Map<string, MessageIntent>();

	async create(intent: MessageIntent): Promise<void> {
		this.intents.set(intent.id, intent);
	}

	async findById(intentId: string): Promise<MessageIntent | null> {
		return this.intents.get(intentId) ?? null;
	}

	async save(intent: MessageIntent): Promise<void> {
		this.intents.set(intent.id, intent);
	}

	async listPendingByOrg(_organizationId: string, _limit: number): Promise<MessageIntent[]> {
		return Array.from(this.intents.values());
	}

	async listApproved(_limit: number): Promise<MessageIntent[]> {
		return Array.from(this.intents.values());
	}

	async listByFilters(_filters: MessageIntentListFilters): Promise<MessageIntent[]> {
		return Array.from(this.intents.values());
	}
}

class InMemoryExecutionProvider implements ExecutionWhatsAppProvider {
	public readonly sent: Array<{ instanceId: string; target: MessageTarget }> = [];

	async send(command: { instanceId: string; target: MessageTarget }): Promise<void> {
		this.sent.push({ instanceId: command.instanceId, target: command.target });
	}
}

const buildIntent = (params: {
	id: string;
	organizationId: string;
	target: MessageTarget;
	type: MessageIntentType;
	purpose: MessageIntentPurpose;
	status?: MessageIntentStatus;
}): MessageIntent =>
	MessageIntent.reconstitute({
		id: params.id,
		organizationId: params.organizationId,
		target: params.target,
		type: params.type,
		purpose: params.purpose,
		payload: { type: "TEXT", text: "Olá" },
		status: params.status ?? "APPROVED",
		decidedByInstanceId: "instance-1",
		blockedReason: null,
		queuedUntil: null,
		createdAt: new Date("2026-01-24T10:00:00.000Z"),
	});

describe("ExecuteMessageUseCase", () => {
	it("sends message and marks intent as sent", async () => {
		const repository = new InMemoryMessageIntentRepository();
		const provider = new InMemoryExecutionProvider();
		const intent = buildIntent({
			id: "intent-1",
			organizationId: "org-1",
			target: { kind: "PHONE", value: "5511999999999" },
			type: "TEXT",
			purpose: "DISPATCH",
		});

		await repository.create(intent);

		const useCase = new ExecuteMessageUseCase(repository, provider);
		const job = new ExecutionJob(
			"job-1",
			intent.id,
			intent.organizationId,
			"instance-1",
			"PENDING",
			0,
			new Date("2026-01-24T10:00:00.000Z"),
		);

		await useCase.execute(job);

		const updated = await repository.findById(intent.id);
		expect(provider.sent).toHaveLength(1);
		expect(updated?.status).toBe("SENT");
	});

	it("throws when intent does not exist", async () => {
		const repository = new InMemoryMessageIntentRepository();
		const provider = new InMemoryExecutionProvider();
		const useCase = new ExecuteMessageUseCase(repository, provider);
		const job = new ExecutionJob(
			"job-1",
			"intent-missing",
			"org-1",
			"instance-1",
			"PENDING",
			0,
			new Date(),
		);

		await expect(useCase.execute(job)).rejects.toThrow("MESSAGE_INTENT_NOT_FOUND");
	});
});

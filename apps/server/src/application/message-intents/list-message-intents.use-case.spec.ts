import { describe, expect, it } from "vitest";

import { MessageIntent } from "../../domain/entities/message-intent";
import type {
	MessageIntentListFilters,
	MessageIntentRepository,
} from "../../domain/repositories/message-intent-repository";
import type { MessageIntentPurpose } from "../../domain/value-objects/message-intent-purpose";
import type { MessageIntentStatus } from "../../domain/value-objects/message-intent-status";
import type { MessageIntentType } from "../../domain/value-objects/message-intent-type";
import type { MessageTarget } from "../../domain/value-objects/message-target";
import { ListMessageIntentsUseCase } from "./list-message-intents.use-case";

class InMemoryMessageIntentRepository implements MessageIntentRepository {
	private readonly intents: MessageIntent[] = [];

	async create(intent: MessageIntent): Promise<void> {
		this.intents.push(intent);
	}

	async findById(intentId: string): Promise<MessageIntent | null> {
		return this.intents.find((intent) => intent.id === intentId) ?? null;
	}

	async save(intent: MessageIntent): Promise<void> {
		const index = this.intents.findIndex((item) => item.id === intent.id);
		if (index >= 0) {
			this.intents[index] = intent;
		} else {
			this.intents.push(intent);
		}
	}

	async listPendingByOrg(organizationId: string, limit: number): Promise<MessageIntent[]> {
		return this.intents
			.filter(
				(intent) =>
					intent.organizationId === organizationId &&
					(intent.status === "PENDING" || intent.status === "QUEUED"),
			)
			.slice(0, limit);
	}

	async listApproved(limit: number): Promise<MessageIntent[]> {
		return this.intents.filter((intent) => intent.status === "APPROVED").slice(0, limit);
	}

	async listByFilters(filters: MessageIntentListFilters): Promise<MessageIntent[]> {
		return this.intents
			.filter((intent) => intent.organizationId === filters.organizationId)
			.filter((intent) => (!filters.status ? true : intent.status === filters.status))
			.filter((intent) => (!filters.purpose ? true : intent.purpose === filters.purpose))
			.filter((intent) =>
				!filters.instanceId ? true : intent.decidedByInstanceId === filters.instanceId,
			)
			.slice(0, filters.limit);
	}
}

const createIntent = (params: {
	id: string;
	organizationId: string;
	target: MessageTarget;
	type: MessageIntentType;
	purpose: MessageIntentPurpose;
	origin?: "CHAT_MANUAL" | "WARMUP" | "SYSTEM";
	status?: MessageIntentStatus;
	decidedByInstanceId?: string | null;
}): MessageIntent =>
	MessageIntent.reconstitute({
		id: params.id,
		organizationId: params.organizationId,
		target: params.target,
		type: params.type,
		purpose: params.purpose,
		origin: params.origin ?? null,
		payload: { type: "TEXT", text: "Olá" },
		status: params.status ?? "PENDING",
		decidedByInstanceId: params.decidedByInstanceId ?? null,
		blockedReason: null,
		queuedUntil: null,
		createdAt: new Date("2026-01-24T10:00:00.000Z"),
	});

describe("ListMessageIntentsUseCase", () => {
	it("lists intents filtered by organization and status", async () => {
		const repository = new InMemoryMessageIntentRepository();
		await repository.create(
			createIntent({
				id: "intent-1",
				organizationId: "org-1",
				target: { kind: "PHONE", value: "5511999999999" },
				type: "TEXT",
				purpose: "DISPATCH",
				status: "APPROVED",
			}),
		);
		await repository.create(
			createIntent({
				id: "intent-2",
				organizationId: "org-1",
				target: { kind: "PHONE", value: "5511888888888" },
				type: "TEXT",
				purpose: "WARMUP",
				status: "PENDING",
			}),
		);
		await repository.create(
			createIntent({
				id: "intent-3",
				organizationId: "org-2",
				target: { kind: "PHONE", value: "5511777777777" },
				type: "TEXT",
				purpose: "DISPATCH",
				status: "APPROVED",
			}),
		);

		const useCase = new ListMessageIntentsUseCase(repository);
		const result = await useCase.execute({
			organizationId: "org-1",
			status: "APPROVED",
		});

		expect(result.items).toHaveLength(1);
		expect(result.items[0]?.id).toBe("intent-1");
	});

	it("filters by purpose and instanceId and applies limit", async () => {
		const repository = new InMemoryMessageIntentRepository();
		await repository.create(
			createIntent({
				id: "intent-1",
				organizationId: "org-1",
				target: { kind: "PHONE", value: "5511999999999" },
				type: "TEXT",
				purpose: "DISPATCH",
				decidedByInstanceId: "instance-1",
			}),
		);
		await repository.create(
			createIntent({
				id: "intent-2",
				organizationId: "org-1",
				target: { kind: "PHONE", value: "5511888888888" },
				type: "TEXT",
				purpose: "DISPATCH",
				decidedByInstanceId: "instance-2",
			}),
		);
		await repository.create(
			createIntent({
				id: "intent-3",
				organizationId: "org-1",
				target: { kind: "PHONE", value: "5511777777777" },
				type: "TEXT",
				purpose: "WARMUP",
				decidedByInstanceId: "instance-1",
			}),
		);

		const useCase = new ListMessageIntentsUseCase(repository);
		const result = await useCase.execute({
			organizationId: "org-1",
			purpose: "DISPATCH",
			instanceId: "instance-1",
			limit: 1,
		});

		expect(result.items).toHaveLength(1);
		expect(result.items[0]?.id).toBe("intent-1");
	});
});

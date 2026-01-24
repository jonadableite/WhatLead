import { describe, expect, it, vi } from "vitest";
import { ExecuteMessageIntentUseCase } from "./execute-message-intent.use-case";
import { MessageIntentExecutorService } from "./message-intent-executor.service";
import { InMemoryMessageExecutionJobRepository } from "../../infra/repositories/in-memory-message-execution-job-repository";
import { InMemoryMessageIntentRepository } from "../../infra/repositories/in-memory-message-intent-repository";
import { MessageExecutionJob } from "../../domain/entities/message-execution-job";
import { MessageIntent } from "../../domain/entities/message-intent";

describe("ExecuteMessageIntentUseCase", () => {
	it("sends approved intent and marks job/intents as sent", async () => {
		const now = new Date("2026-01-24T00:00:00.000Z");
		const intents = new InMemoryMessageIntentRepository();
		const jobs = new InMemoryMessageExecutionJobRepository();

		const intent = MessageIntent.create({
			id: "mi-1",
			organizationId: "t-1",
			target: { kind: "PHONE", value: "t" },
			type: "TEXT",
			purpose: "DISPATCH",
			payload: { type: "TEXT", text: "oi" },
			now,
		});
		intent.approve({ instanceId: "i-1", now });
		await intents.create(intent);

		const job = MessageExecutionJob.create({
			id: "j-1",
			intentId: "mi-1",
			instanceId: "i-1",
			provider: "TURBOZAP",
			now,
		});
		await jobs.create(job);

		const provider = {
			sendText: vi.fn(async () => {}),
			sendMedia: vi.fn(async () => {}),
			sendAudio: vi.fn(async () => {}),
			sendReaction: vi.fn(async () => {}),
		};
		const executor = new MessageIntentExecutorService(provider as any);

		const eventBus = {
			publish: vi.fn(),
			publishMany: vi.fn(),
		};

		const useCase = new ExecuteMessageIntentUseCase(
			jobs,
			intents,
			executor,
			eventBus as any,
			null,
		);

		const out = await useCase.execute({ jobId: "j-1", now });
		expect(out.status).toBe("SENT");

		expect(provider.sendText).toHaveBeenCalledTimes(1);
		expect(provider.sendText).toHaveBeenCalledWith({ instanceId: "i-1", to: "t", text: "oi" });

		const savedIntent = await intents.findById("mi-1");
		expect(savedIntent?.status).toBe("SENT");

		const savedJob = await jobs.findById("j-1");
		expect(savedJob?.status).toBe("SENT");
		expect(eventBus.publishMany).toHaveBeenCalledTimes(1);
	});

	it("fails and schedules retry when provider throws", async () => {
		const now = new Date("2026-01-24T00:00:00.000Z");
		const intents = new InMemoryMessageIntentRepository();
		const jobs = new InMemoryMessageExecutionJobRepository();

		const intent = MessageIntent.create({
			id: "mi-1",
			organizationId: "t-1",
			target: { kind: "PHONE", value: "t" },
			type: "TEXT",
			purpose: "DISPATCH",
			payload: { type: "TEXT", text: "oi" },
			now,
		});
		intent.approve({ instanceId: "i-1", now });
		await intents.create(intent);

		const job = MessageExecutionJob.create({
			id: "j-1",
			intentId: "mi-1",
			instanceId: "i-1",
			provider: "TURBOZAP",
			now,
		});
		await jobs.create(job);

		const provider = {
			sendText: vi.fn(async () => {
				throw new Error("provider down");
			}),
			sendMedia: vi.fn(),
			sendAudio: vi.fn(),
			sendReaction: vi.fn(),
		};
		const executor = new MessageIntentExecutorService(provider as any);

		const eventBus = {
			publish: vi.fn(),
			publishMany: vi.fn(),
		};

		const useCase = new ExecuteMessageIntentUseCase(
			jobs,
			intents,
			executor,
			eventBus as any,
			null,
			2,
		);

		const out = await useCase.execute({ jobId: "j-1", now });
		expect(out.status).toBe("FAILED");
		expect((out as any).willRetry).toBe(true);

		const savedJob = await jobs.findById("j-1");
		expect(savedJob?.status).toBe("FAILED");
		expect(eventBus.publishMany).toHaveBeenCalledTimes(1);
	});
});

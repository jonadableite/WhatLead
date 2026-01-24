import { describe, expect, it, vi } from "vitest";
import { MessageExecutorWorker } from "./message-executor.worker";
import { CreateExecutionJobUseCase } from "../../message-execution/create-execution-job.use-case";
import { ExecuteMessageIntentUseCase } from "../../message-execution/execute-message-intent.use-case";
import { MessageIntentExecutorService } from "../../message-execution/message-intent-executor.service";
import { RetryFailedExecutionUseCase } from "../../message-execution/retry-failed-execution.use-case";
import { MessageIntent } from "../../../domain/entities/message-intent";
import { Instance } from "../../../domain/entities/instance";
import { InstanceReputation } from "../../../domain/entities/instance-reputation";
import { InMemoryMessageExecutionJobRepository } from "../../../infra/repositories/in-memory-message-execution-job-repository";
import { InMemoryMessageIntentRepository } from "../../../infra/repositories/in-memory-message-intent-repository";

describe("MessageExecutorWorker", () => {
	it("creates jobs for approved intents and executes runnable jobs", async () => {
		const now = new Date("2026-01-24T00:00:00.000Z");
		const intents = new InMemoryMessageIntentRepository();
		const jobs = new InMemoryMessageExecutionJobRepository();

		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "t-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();

		const instances = {
			findById: vi.fn(async () => instance),
		};

		const idFactory = { createId: () => "job-1" };
		const createJob = new CreateExecutionJobUseCase(jobs, intents, instances as any, idFactory);

		const provider = {
			sendText: vi.fn(async () => {}),
			sendMedia: vi.fn(async () => {}),
			sendAudio: vi.fn(async () => {}),
			sendReaction: vi.fn(async () => {}),
		};
		const executor = new MessageIntentExecutorService(provider as any);
		const eventBus = { publish: vi.fn(), publishMany: vi.fn() };
		const execute = new ExecuteMessageIntentUseCase(jobs, intents, executor, eventBus as any, null, 3);
		const retry = new RetryFailedExecutionUseCase(jobs);

		const worker = new MessageExecutorWorker(
			intents,
			jobs,
			createJob,
			execute,
			retry,
			{ approvedScanLimit: 10, jobScanLimit: 10, maxAttempts: 3 },
		);

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

		await worker.run(now);

		const job = await jobs.findByIntentId("mi-1");
		expect(job).not.toBeNull();
		expect(provider.sendText).toHaveBeenCalledTimes(1);
		expect((await intents.findById("mi-1"))?.status).toBe("SENT");
		expect((await jobs.findById(job!.id))?.status).toBe("SENT");
	});
});

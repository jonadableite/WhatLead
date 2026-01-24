import { describe, expect, it } from "vitest";

import type {
	CreateExecutionJobUseCaseRequest,
	CreateExecutionJobUseCaseResponse,
} from "../../message-execution/create-execution-job.use-case";
import { CreateExecutionJobUseCase } from "./create-execution-job.use-case";
import type { ExecutionQueue, ExecutionQueueJob } from "../ports/execution-queue";

class InMemoryExecutionQueue implements ExecutionQueue {
	public readonly enqueued: ExecutionQueueJob[] = [];

	async enqueue(job: ExecutionQueueJob): Promise<void> {
		this.enqueued.push(job);
	}
}

class StubCreateMessageExecutionJobUseCase {
	constructor(private readonly response: CreateExecutionJobUseCaseResponse) {}

	async execute(
		_request: CreateExecutionJobUseCaseRequest,
	): Promise<CreateExecutionJobUseCaseResponse> {
		return this.response;
	}
}

describe("CreateExecutionJobUseCase (execution)", () => {
	it("enqueues when a new job is created", async () => {
		const queue = new InMemoryExecutionQueue();
		const baseUseCase = new StubCreateMessageExecutionJobUseCase({
			jobId: "job-1",
			created: true,
		});
		const useCase = new CreateExecutionJobUseCase(baseUseCase, queue);

		await useCase.execute({
			intentId: "intent-1",
			organizationId: "org-1",
			now: new Date("2026-01-24T10:00:00.000Z"),
		});

		expect(queue.enqueued).toHaveLength(1);
		expect(queue.enqueued[0]?.jobId).toBe("job-1");
	});

	it("does not enqueue when job already exists", async () => {
		const queue = new InMemoryExecutionQueue();
		const baseUseCase = new StubCreateMessageExecutionJobUseCase({
			jobId: "job-2",
			created: false,
		});
		const useCase = new CreateExecutionJobUseCase(baseUseCase, queue);

		await useCase.execute({
			intentId: "intent-2",
			organizationId: "org-1",
			now: new Date("2026-01-24T10:00:00.000Z"),
		});

		expect(queue.enqueued).toHaveLength(0);
	});
});

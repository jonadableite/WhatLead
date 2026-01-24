import { describe, expect, it } from "vitest";
import { CreateExecutionJobUseCase } from "./create-execution-job.use-case";
import { MessageIntent } from "../../domain/entities/message-intent";
import { InMemoryMessageIntentRepository } from "../../infra/repositories/in-memory-message-intent-repository";
import { InMemoryMessageExecutionJobRepository } from "../../infra/repositories/in-memory-message-execution-job-repository";
import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";

describe("CreateExecutionJobUseCase", () => {
	it("creates only one job per approved intent (idempotent)", async () => {
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

		const instances = {
			findById: async () => instance,
		};

		const idFactory = {
			createId: (() => {
				let i = 0;
				return () => `job-${++i}`;
			})(),
		};

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

		const useCase = new CreateExecutionJobUseCase(
			jobs,
			intents,
			instances as any,
			idFactory,
		);

		const first = await useCase.execute({ intentId: "mi-1", organizationId: "t-1", now });
		const second = await useCase.execute({ intentId: "mi-1", organizationId: "t-1", now });

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.jobId).toBe(first.jobId);
	});
});


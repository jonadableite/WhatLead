import { describe, expect, it } from "vitest";
import { GetMessageIntentTimelineUseCase } from "./get-message-intent-timeline.use-case";
import { InMemoryMessageIntentRepository } from "../../infra/repositories/in-memory-message-intent-repository";
import { InMemoryMessageExecutionJobRepository } from "../../infra/repositories/in-memory-message-execution-job-repository";
import { InMemoryOperationalEventRepository } from "../../infra/repositories/in-memory-operational-event-repository";
import { MessageExecutionJob } from "../../domain/entities/message-execution-job";
import { MessageIntent } from "../../domain/entities/message-intent";

describe("GetMessageIntentTimelineUseCase", () => {
	it("returns synthetic created + stored operational events", async () => {
		const now = new Date("2026-01-24T00:00:00.000Z");
		const intents = new InMemoryMessageIntentRepository();
		const jobs = new InMemoryMessageExecutionJobRepository();
		const events = new InMemoryOperationalEventRepository();

		const intent = MessageIntent.create({
			id: "mi-1",
			organizationId: "t-1",
			target: { kind: "PHONE", value: "t" },
			type: "TEXT",
			purpose: "DISPATCH",
			payload: { type: "TEXT", text: "oi" },
			now,
		});
		intent.approve({ instanceId: "i-1", now: new Date("2026-01-24T00:00:10.000Z") });
		await intents.create(intent);

		const job = MessageExecutionJob.create({
			id: "j-1",
			intentId: "mi-1",
			instanceId: "i-1",
			provider: "TURBOZAP",
			now,
		});
		await jobs.create(job);

		await events.appendMany([
			{
				id: "e-1",
				organizationId: "t-1",
				aggregateType: "MESSAGE_INTENT",
				aggregateId: "mi-1",
				eventType: "MessageApproved",
				payload: { intentId: "mi-1" },
				occurredAt: new Date("2026-01-24T00:00:10.000Z"),
				createdAt: now,
			},
		]);

		const useCase = new GetMessageIntentTimelineUseCase(intents, jobs, events);
		const out = await useCase.execute({ intentId: "mi-1", organizationId: "t-1" });

		expect(out.intent.id).toBe("mi-1");
		expect(out.job?.id).toBe("j-1");
		expect(out.events[0]?.eventType).toBe("MessageIntentCreated");
		expect(out.events.some((e) => e.eventType === "MessageApproved")).toBe(true);
	});
});


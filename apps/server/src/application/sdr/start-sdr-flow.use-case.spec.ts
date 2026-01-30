import { describe, expect, it, vi } from "vitest";
import { AgentOrchestratorUseCase } from "../agents/agent-orchestrator.use-case";
import { DefaultAgentPlaybook } from "../agents/default-agent-playbook";
import { CreateLeadUseCase } from "./create-lead.use-case";
import { OpenConversationForLeadUseCase } from "./open-conversation-for-lead.use-case";
import { StartSdrFlowUseCase } from "./start-sdr-flow.use-case";
import { InMemoryLeadRepository } from "../../infra/repositories/in-memory-lead-repository";
import { InMemoryConversationRepository } from "../../infra/repositories/in-memory-conversation-repository";
import { InMemoryInstanceRepository } from "../../infra/repositories/in-memory-instance-repository";
import { InMemoryAgentRepository } from "../../infra/repositories/in-memory-agent-repository";
import { Agent } from "../../domain/entities/agent";
import { SLAEvaluator } from "../../domain/services/sla-evaluator";
import { Instance } from "../../domain/entities/instance";
import { InstanceReputation } from "../../domain/entities/instance-reputation";

describe("StartSdrFlowUseCase", () => {
	it("creates lead, links conversation, assigns agent and dispatches", async () => {
		const leads = new InMemoryLeadRepository();
		const conversations = new InMemoryConversationRepository();
		const instances = new InMemoryInstanceRepository();
		const rep = InstanceReputation.initialize("i-1");
		const instance = Instance.initialize({
			id: "i-1",
			companyId: "t-1",
			engine: "TURBOZAP",
			reputation: rep,
		});
		instance.markConnected();
		await instances.create(instance);
		const agents = new InMemoryAgentRepository([
			Agent.create({ id: "a-1", organizationId: "t-1", role: "SDR", status: "ONLINE", purpose: "SDR" }),
		]);

		const idFactory = {
			createId: (() => {
				let i = 0;
				return () => `id-${++i}`;
			})(),
		};

		const createLead = new CreateLeadUseCase(leads, idFactory);
		const openConversation = new OpenConversationForLeadUseCase(instances as any, conversations, idFactory);
		const orchestrator = new AgentOrchestratorUseCase(
			conversations,
			agents as any,
			new SLAEvaluator(),
			new DefaultAgentPlaybook(),
			leads as any,
		);

		const dispatch = {
			execute: vi.fn(async () => ({
				decision: { allowed: true, maxMessages: 10, minIntervalSeconds: 0, allowedMessageTypes: ["TEXT"] },
				result: { status: "SENT", occurredAt: new Date("2026-01-16T00:00:00.000Z") },
			})),
		};

		const useCase = new StartSdrFlowUseCase(
			createLead,
			openConversation,
			orchestrator,
			dispatch as any,
			leads,
			conversations,
		);

		const out = await useCase.execute({
			instanceId: "i-1",
			contactId: "p-1",
			name: "Fulano",
			email: "f@x.com",
			phone: "p-1",
			now: new Date("2026-01-16T00:00:00.000Z"),
		});

		expect(out.dispatchStatus).toBe("SENT");
		expect(out.agentId).toBe("a-1");

		const lead = await leads.findById({ id: out.leadId });
		expect(lead?.stage).toBe("CONTACTED");

		const conversation = await conversations.findById({ id: out.conversationId });
		expect(conversation?.leadId).toBe(out.leadId);
		expect(conversation?.assignedAgentId).toBe("a-1");
		expect(dispatch.execute).toHaveBeenCalledTimes(1);
	});
});


import { createContext } from "@WhatLead/api/context";
import { type AppRouter, appRouter } from "@WhatLead/api/routers/index";
import { auth } from "@WhatLead/auth";
import prisma from "@WhatLead/db";
import { env } from "@WhatLead/env/server";
import { createRequestLogger, generateTraceId } from "@WhatLead/logger";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import fastifyCors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import {
    fastifyTRPCPlugin,
    type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import {
    convertToModelMessages,
    streamText,
    type UIMessage,
    wrapLanguageModel,
} from "ai";
import { randomUUID } from "crypto";
import Fastify from "fastify";
import { AgentOrchestratorUseCase } from "./application/agents/agent-orchestrator.use-case";
import { DefaultAgentPlaybook } from "./application/agents/default-agent-playbook";
import { AssignConversationUseCase } from "./application/conversation/assign-conversation.use-case";
import { ConversationEventPipelineUseCase } from "./application/conversation/conversation-event-pipeline.use-case";
import { ConversationRouter } from "./application/conversation/conversation-router";
import { ReplyIntentDispatcher } from "./application/conversation/reply-intent-dispatcher";
import { DispatchGateUseCase } from "./application/dispatch-gate/dispatch-gate.use-case";
import { DispatchUseCase } from "./application/dispatch/dispatch.use-case";
import { InstanceHealthCronJob } from "./application/handlers/cron/instance-health.cron";
import { MessageExecutorWorker } from "./application/handlers/cron/message-executor.worker";
import { PreDispatchGuard } from "./application/handlers/dispatch/pre-dispatch.guard";
import { WhatsAppWebhookApplicationHandler } from "./application/handlers/webhook/whatsapp-webhook.handler";
import { DelayedDispatchPort } from "./application/heater/delayed-dispatch-port";
import { GuardedDispatchPort } from "./application/heater/guarded-dispatch-port";
import { ConnectInstanceUseCase } from "./application/instances/connect-instance.use-case";
import { CreateInstanceUseCase } from "./application/instances/create-instance.use-case";
import { EvaluateInstanceHealthOnDemandUseCase } from "./application/instances/evaluate-instance-health-on-demand.use-case";
import { GetInstanceConnectionStatusUseCase } from "./application/instances/get-instance-connection-status.use-case";
import { GetInstanceQRCodeUseCase } from "./application/instances/get-instance-qrcode.use-case";
import { GetInstanceUseCase } from "./application/instances/get-instance.use-case";
import { ListInstancesUseCase } from "./application/instances/list-instances.use-case";
import { DispatchMessageIntentGateUseCase } from "./application/message-dispatch/dispatch-message-intent-gate.use-case";
import { CreateExecutionJobUseCase } from "./application/message-execution/create-execution-job.use-case";
import { ExecuteMessageIntentUseCase } from "./application/message-execution/execute-message-intent.use-case";
import { MessageIntentExecutorService } from "./application/message-execution/message-intent-executor.service";
import { RetryFailedExecutionUseCase } from "./application/message-execution/retry-failed-execution.use-case";
import { CreateMessageIntentUseCase } from "./application/message-intents/create-message-intent.use-case";
import { DecideMessageIntentUseCase } from "./application/message-intents/decide-message-intent.use-case";
import { ListMessageIntentsUseCase } from "./application/message-intents/list-message-intents.use-case";
import { ExecutionControlPolicy } from "./application/ops/execution-control-policy";
import { GetExecutionMetricsUseCase } from "./application/ops/get-execution-metrics.use-case";
import { GetMessageIntentTimelineUseCase } from "./application/ops/get-message-intent-timeline.use-case";
import { PauseInstanceUseCase } from "./application/ops/pause-instance.use-case";
import { PauseOrganizationUseCase } from "./application/ops/pause-organization.use-case";
import { ResumeInstanceUseCase } from "./application/ops/resume-instance.use-case";
import { ResumeOrganizationUseCase } from "./application/ops/resume-organization.use-case";
import { WhatsAppProviderFactory } from "./application/providers/whatsapp-provider-factory";
import { CreateLeadUseCase } from "./application/sdr/create-lead.use-case";
import { OpenConversationForLeadUseCase } from "./application/sdr/open-conversation-for-lead.use-case";
import { StartSdrFlowUseCase } from "./application/sdr/start-sdr-flow.use-case";
import { UpdateLeadOnInboundUseCase } from "./application/sdr/update-lead-on-inbound.use-case";
import { GetReputationTimelineUseCase } from "./application/use-cases/get-reputation-timeline.use-case";
import { InboundMessageUseCase } from "./application/use-cases/inbound-message.use-case";
import { IngestReputationSignalUseCase } from "./application/use-cases/ingest-reputation-signal.use-case";
import { OutboundMessageRecordedUseCase } from "./application/use-cases/outbound-message-recorded.use-case";
import { RecordReputationSignalUseCase } from "./application/use-cases/record-reputation-signal.use-case";
import { WarmupOrchestratorUseCase } from "./application/warmup/warmup-orchestrator.use-case";
import { Agent } from "./domain/entities/agent";
import { DispatchPolicy } from "./domain/services/dispatch-policy";
import { InstanceDispatchScoreService } from "./domain/services/instance-dispatch-score-service";
import { InstanceReputationEvaluator } from "./domain/services/instance-reputation-evaluator";
import { SLAEvaluator } from "./domain/services/sla-evaluator";
import { EvaluateInstanceHealthUseCase } from "./domain/use-cases/evaluate-instance-health";
import { StaticPlanPolicy } from "./infra/billing/static-plan-policy";
import { PrismaActiveInstanceIdsProvider } from "./infra/cron/prisma-active-instance-ids-provider";
import { InMemoryDispatchGateDecisionRecorder } from "./infra/dispatch-gate/in-memory-dispatch-gate-decision-recorder";
import { TimelineDispatchRateSnapshotAdapter } from "./infra/dispatch-gate/timeline-dispatch-rate-snapshot-adapter";
import { WhatsAppMessageDispatchAdapter } from "./infra/dispatch/whatsapp-message-dispatch-adapter";
import { CompositeDomainEventBus } from "./infra/event-bus/composite-domain-event-bus";
import { LoggingDomainEventBus } from "./infra/event-bus/logging-domain-event-bus";
import { StaticWarmUpContentProvider } from "./infra/heater/static-warmup-content-provider";
import { StaticWarmUpTargetsProvider } from "./infra/heater/static-warmup-targets-provider";
import { WhatsAppProviderDispatchAdapter } from "./infra/heater/whatsapp-dispatch-adapter";
import { WhatsMeowProviderAdapter } from "./infra/message-execution/whatsmeow-provider-adapter";
import { SignalBackedInstanceMetricRepository } from "./infra/metrics/signal-backed-instance-metric-repository";
import { PrismaExecutionMetricsQuery } from "./infra/ops/prisma-execution-metrics-query";
import { PersistingMessageExecutionEventBus } from "./infra/ops/persisting-message-execution-event-bus";
import { PersistingMessageIntentEventBus } from "./infra/ops/persisting-message-intent-event-bus";
import { registerTurboZapProvider } from "./infra/providers/whatsapp/turbozap/turbozap.provider";
import { InMemoryAgentRepository } from "./infra/repositories/in-memory-agent-repository";
import { InMemoryInstanceReputationRepository } from "./infra/repositories/in-memory-instance-reputation-repository";
import { PrismaConversationRepository } from "./infra/repositories/prisma-conversation-repository";
import { PrismaExecutionControlRepository } from "./infra/repositories/prisma-execution-control-repository";
import { PrismaInstanceRepository } from "./infra/repositories/prisma-instance-repository";
import { PrismaLeadRepository } from "./infra/repositories/prisma-lead-repository";
import { PrismaMessageExecutionJobRepository } from "./infra/repositories/prisma-message-execution-job-repository";
import { PrismaMessageIntentRepository } from "./infra/repositories/prisma-message-intent-repository";
import { PrismaMessageRepository } from "./infra/repositories/prisma-message-repository";
import { PrismaOperationalEventRepository } from "./infra/repositories/prisma-operational-event-repository";
import {
    isCrossSiteMutationWithoutOrigin,
    isProbablyAutomation,
    isUntrustedOrigin,
} from "./infra/security/bot-fight";
import { verifyTurnstile } from "./infra/security/turnstile";
import { InMemoryReputationSignalRepository } from "./infra/signals/in-memory-reputation-signal-repository";
import { LoggingIngestReputationSignalUseCase } from "./infra/signals/logging-ingest-reputation-signal-use-case";
import { PrismaReputationSignalRepository } from "./infra/signals/prisma-reputation-signal-repository";
import { SignalMetricIngestionAdapter } from "./infra/signals/signal-metric-ingestion-adapter";
import { registerInstanceRoutes } from "./infra/web/instances.routes";
import { registerMessageIntentRoutes } from "./infra/web/message-intents.routes";
import { registerOpsRoutes } from "./infra/web/ops.routes";
import { registerSdrFlowRoutes } from "./infra/web/sdr-flow.routes";
import { registerWebhookRoutes } from "./infra/webhooks/whatsapp-webhook.routes";

// =============================================================================
// FASTIFY SERVER CONFIGURATION
// =============================================================================

// Create custom logger instance for the server
const serverLogger = createRequestLogger();

const fastify = Fastify({
	logger: false, // Disable default Fastify logger, we'll use our custom one
	// Security: limite de tamanho do body
	bodyLimit: 1048576, // 1MB
	// Trusty proxy para obter IP real atrás de load balancers
	trustProxy: true,
	// Custom request ID generation with traceId
	genReqId: () => generateTraceId(),
});

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

const baseCorsConfig = {
	origin: env.CORS_ORIGIN,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86400,
};

await fastify.register(fastifyCors, baseCorsConfig);

// =============================================================================
// TRACE ID MIDDLEWARE
// =============================================================================

// Extract or generate trace ID for request correlation
fastify.addHook("onRequest", async (request, reply) => {
	// Check for trace ID in headers (X-Trace-Id, X-Request-Id, etc.)
	const traceId = request.headers["x-trace-id"] ||
		request.headers["x-request-id"] ||
		request.headers["trace-id"] ||
		reply.request.id; // Fallback to Fastify's generated ID

	// Set trace ID on the request object for use in context
	(reply.request as any).traceId = traceId;
});

fastify.addHook("onRequest", async (request, reply) => {
	if (env.BOT_FIGHT_MODE === "OFF") {
		return;
	}

	const url = request.url.split("?")[0] ?? request.url;
	const isSensitive = url.startsWith("/api/auth/") || url === "/ai";
	if (!isSensitive) {
		return;
	}

	const userAgent = request.headers["user-agent"];
	const tokenHeader =
		request.headers["cf-turnstile-response"] ?? request.headers["x-turnstile-token"];
	const turnstileToken = typeof tokenHeader === "string" ? tokenHeader : undefined;
	const hasTurnstile = Boolean(env.TURNSTILE_SECRET_KEY && turnstileToken);

	if (isProbablyAutomation(typeof userAgent === "string" ? userAgent : undefined)) {
		if (
			hasTurnstile &&
			(await verifyTurnstile({
				secretKey: env.TURNSTILE_SECRET_KEY!,
				token: turnstileToken!,
				remoteIp: request.ip,
			}))
		) {
			return;
		}

		return reply.status(403).send({
			error: {
				message: "Acesso bloqueado",
				status: 403,
				code: "BOT_BLOCKED",
			},
		});
	}

	const origin = request.headers.origin;
	const referer = request.headers.referer;

	if (url.startsWith("/api/auth/")) {
		if (
			isCrossSiteMutationWithoutOrigin({
				method: request.method,
				origin: typeof origin === "string" ? origin : undefined,
				referer: typeof referer === "string" ? referer : undefined,
			})
		) {
			if (
				hasTurnstile &&
				(await verifyTurnstile({
					secretKey: env.TURNSTILE_SECRET_KEY!,
					token: turnstileToken!,
					remoteIp: request.ip,
				}))
			) {
				return;
			}

			return reply.status(403).send({
				error: {
					message: "Requisicao sem origem",
					status: 403,
					code: "BOT_CHALLENGE_REQUIRED",
				},
			});
		}

		if (
			isUntrustedOrigin({
				origin: typeof origin === "string" ? origin : undefined,
				referer: typeof referer === "string" ? referer : undefined,
				trustedOrigin: env.CORS_ORIGIN,
			})
		) {
			if (
				hasTurnstile &&
				(await verifyTurnstile({
					secretKey: env.TURNSTILE_SECRET_KEY!,
					token: turnstileToken!,
					remoteIp: request.ip,
				}))
			) {
				return;
			}

			return reply.status(403).send({
				error: {
					message: "Origem nao confiavel",
					status: 403,
					code: "UNTRUSTED_ORIGIN",
				},
			});
		}
	}
});

// =============================================================================
// REQUEST LOGGING MIDDLEWARE
// =============================================================================

// Log all incoming requests
fastify.addHook("onRequest", async (request, reply) => {
	const traceId = (reply.request as any).traceId;
	const requestLogger = createRequestLogger(traceId);
	requestLogger.info({
		method: request.method,
		url: request.url,
		userAgent: request.headers["user-agent"],
		ip: request.ip,
		headers: {
			"x-trace-id": traceId,
			"content-type": request.headers["content-type"],
			"authorization": request.headers.authorization ? "[PRESENT]" : "[MISSING]",
		},
		icon: "🌐",
		event: "request",
	}, "Incoming request");
});

// Log all responses
fastify.addHook("onResponse", async (request, reply) => {
	const traceId = (reply.request as any).traceId;
	const requestLogger = createRequestLogger(traceId);
	const responseTime = Date.now() - (reply.request as any).startTime || Date.now();

	requestLogger.info({
		method: request.method,
		url: request.url,
		statusCode: reply.statusCode,
		responseTime,
		contentLength: reply.getHeader("content-length"),
		icon: reply.statusCode >= 400 ? "❌" : "📤",
		event: reply.statusCode >= 400 ? "request_error" : "response",
	}, "Request completed");
});

fastify.addHook("onSend", async (_request, reply, payload) => {
	reply.header("x-content-type-options", "nosniff");
	reply.header("x-frame-options", "DENY");
	reply.header("referrer-policy", "no-referrer");
	reply.header("permissions-policy", "camera=(), microphone=(), geolocation=()");
	return payload;
});

// =============================================================================
// RATE LIMITING - GLOBAL
// Proteção contra DDoS e abuso de API
// =============================================================================

await fastify.register(rateLimit, {
	global: true,
	max: 100, // 100 requests
	timeWindow: "1 minute",
	keyGenerator: (request) => {
		// Rate limit por IP (usa IP real mesmo atrás de proxy)
		return request.ip;
	},
	errorResponseBuilder: (_request, context) => ({
		success: false,
		error: "Muitas requisicoes",
		message: `Limite excedido. Tente novamente em ${context.after}`,
		code: "RATE_LIMIT_EXCEEDED",
		statusCode: 429,
	}),
	// Skip rate limit para health checks
	allowList: (request) => {
		return request.url === "/" || request.url === "/health";
	},
});

registerTurboZapProvider();

const signalRepository =
	env.REPUTATION_SIGNAL_REPOSITORY === "prisma"
		? new PrismaReputationSignalRepository(env.REPUTATION_SIGNAL_RETENTION_DAYS)
		: new InMemoryReputationSignalRepository();
const metricRepository = new SignalBackedInstanceMetricRepository(signalRepository);
const reputationRepository = new InMemoryInstanceReputationRepository();
const instanceRepository = new PrismaInstanceRepository(reputationRepository);
const evaluator = new InstanceReputationEvaluator();
const eventBus = new LoggingDomainEventBus();
const evaluateInstanceHealth = new EvaluateInstanceHealthUseCase(
	instanceRepository,
	reputationRepository,
	metricRepository,
	evaluator,
	eventBus,
);
const recordSignal = new RecordReputationSignalUseCase(
	signalRepository,
	evaluateInstanceHealth,
);
const ingestSignal = new IngestReputationSignalUseCase(recordSignal);
const ingestSignalWithLogging = new LoggingIngestReputationSignalUseCase(ingestSignal);
const metricIngestion = new SignalMetricIngestionAdapter(ingestSignal);
const activeInstanceIdsProvider = new PrismaActiveInstanceIdsProvider();
const instanceHealthCronJob = new InstanceHealthCronJob(
	activeInstanceIdsProvider,
	evaluateInstanceHealth,
);
let instanceHealthCronTimer: NodeJS.Timeout | null = null;
const INSTANCE_HEALTH_CRON_INTERVAL_MS = 60_000;
let messageExecutorCronTimer: NodeJS.Timeout | null = null;
const MESSAGE_EXECUTOR_CRON_INTERVAL_MS = 5_000;

const conversationRepository = new PrismaConversationRepository();
const messageRepository = new PrismaMessageRepository();
const leadRepository = new PrismaLeadRepository();
const idFactory = { createId: () => randomUUID() };
const outboundMessageRecorded = new OutboundMessageRecordedUseCase(
	conversationRepository,
	messageRepository,
	idFactory,
);

const timeline = new GetReputationTimelineUseCase(signalRepository);
const dispatchPolicy = new DispatchPolicy();
const rateSnapshots = new TimelineDispatchRateSnapshotAdapter(timeline);
const planPolicy = new StaticPlanPolicy();
const executionControlRepository = new PrismaExecutionControlRepository();
const executionControlPolicy = new ExecutionControlPolicy(executionControlRepository);
const messageIntentRepository = new PrismaMessageIntentRepository();
const operationalEvents = new PrismaOperationalEventRepository();
const messageIntentEventBus = new CompositeDomainEventBus([
	new LoggingDomainEventBus(),
	new PersistingMessageIntentEventBus(operationalEvents, idFactory),
]);
const instanceDispatchScorer = new InstanceDispatchScoreService();
const messageIntentGate = new DispatchMessageIntentGateUseCase(
	messageIntentRepository,
	instanceRepository,
	evaluateInstanceHealth,
	dispatchPolicy,
	rateSnapshots,
	planPolicy,
	executionControlPolicy,
	instanceDispatchScorer,
	messageIntentEventBus,
);
const createMessageIntent = new CreateMessageIntentUseCase(
	messageIntentRepository,
	idFactory,
);
const decideMessageIntent = new DecideMessageIntentUseCase(
	messageIntentRepository,
	messageIntentGate,
);
const listMessageIntents = new ListMessageIntentsUseCase(messageIntentRepository);
const slaEvaluator = new SLAEvaluator();
const gateDecisionRecorder = new InMemoryDispatchGateDecisionRecorder();
const dispatchGate = new DispatchGateUseCase(
	instanceRepository,
	evaluateInstanceHealth,
	dispatchPolicy,
	rateSnapshots,
	conversationRepository,
	slaEvaluator,
	gateDecisionRecorder,
);

const provider = WhatsAppProviderFactory.create("TURBOZAP", {
	baseUrl: env.TURBOZAP_BASE_URL,
	apiKey: env.TURBOZAP_API_KEY,
	timeoutMs: env.TURBOZAP_TIMEOUT_MS,
});

const messageExecutionJobRepository = new PrismaMessageExecutionJobRepository();
const messageExecutionEventBus = new CompositeDomainEventBus([
	new LoggingDomainEventBus(),
	new PersistingMessageExecutionEventBus(operationalEvents, idFactory),
]);
const whatsMeowProviderPort = new WhatsMeowProviderAdapter(provider);
const messageIntentExecutor = new MessageIntentExecutorService(whatsMeowProviderPort);
const createExecutionJob = new CreateExecutionJobUseCase(
	messageExecutionJobRepository,
	messageIntentRepository,
	instanceRepository,
	idFactory,
);
const executeMessageIntent = new ExecuteMessageIntentUseCase(
	messageExecutionJobRepository,
	messageIntentRepository,
	messageIntentExecutor,
	messageExecutionEventBus,
	executionControlPolicy,
);
const retryFailedExecution = new RetryFailedExecutionUseCase(messageExecutionJobRepository);
const messageExecutorWorker = new MessageExecutorWorker(
	messageIntentRepository,
	messageExecutionJobRepository,
	createExecutionJob,
	executeMessageIntent,
	retryFailedExecution,
	{
		approvedScanLimit: 100,
		jobScanLimit: 50,
		maxAttempts: ExecuteMessageIntentUseCase.DEFAULT_MAX_ATTEMPTS,
	},
);

const getExecutionMetrics = new GetExecutionMetricsUseCase(
	new PrismaExecutionMetricsQuery(),
);

const pauseInstance = new PauseInstanceUseCase(executionControlRepository, idFactory);
const resumeInstance = new ResumeInstanceUseCase(executionControlRepository, idFactory);
const pauseOrganization = new PauseOrganizationUseCase(executionControlRepository, idFactory);
const resumeOrganization = new ResumeOrganizationUseCase(executionControlRepository, idFactory);
const getMessageIntentTimeline = new GetMessageIntentTimelineUseCase(
	messageIntentRepository,
	messageExecutionJobRepository,
	operationalEvents,
);

const dispatchPort = new WhatsAppProviderDispatchAdapter(provider);
const preDispatchGuard = new PreDispatchGuard(dispatchGate);
const delayedDispatchPort = new DelayedDispatchPort(dispatchPort);
const guardedDispatchPort = new GuardedDispatchPort(
	delayedDispatchPort,
	preDispatchGuard,
);
const warmUpTargets = new StaticWarmUpTargetsProvider(env.WARMUP_TARGETS);
const warmUpContent = new StaticWarmUpContentProvider();
const messageDispatchPort = new WhatsAppMessageDispatchAdapter(provider);
const dispatch = new DispatchUseCase(
	instanceRepository,
	dispatchGate,
	messageDispatchPort,
	metricIngestion,
	outboundMessageRecorded,
);
const heater = new WarmupOrchestratorUseCase(
	instanceRepository,
	evaluateInstanceHealth,
	warmUpTargets,
	warmUpContent,
	messageIntentRepository,
	messageIntentGate,
	idFactory,
	guardedDispatchPort,
	metricIngestion,
	timeline,
	rateSnapshots,
);
fastify.decorate("heater", heater);

const inboundMessage = new InboundMessageUseCase({
	instanceRepository,
	conversationRepository,
	messageRepository,
	idFactory,
});
const agents = new InMemoryAgentRepository([
	Agent.create({
		id: "agent-sdr-1",
		organizationId: "system",
		role: "SDR",
		status: "ONLINE",
		purpose: "SDR",
	}),
	Agent.create({
		id: "agent-follow-1",
		organizationId: "system",
		role: "SDR",
		status: "ONLINE",
		purpose: "FOLLOW_UP",
	}),
]);
const router = new ConversationRouter(agents);
const assignConversation = new AssignConversationUseCase(conversationRepository);
const replyDispatcher = new ReplyIntentDispatcher(dispatch);
const updateLeadOnInbound = new UpdateLeadOnInboundUseCase(
	conversationRepository,
	leadRepository,
);
const ingestConversation = new ConversationEventPipelineUseCase(
	inboundMessage,
	outboundMessageRecorded,
	conversationRepository,
	instanceRepository,
	router,
	assignConversation,
	replyDispatcher,
	updateLeadOnInbound,
);
const webhookEventHandler = new WhatsAppWebhookApplicationHandler(
	ingestConversation,
	ingestSignalWithLogging,
);

await registerWebhookRoutes(fastify, {
	eventHandler: webhookEventHandler,
});

await registerMessageIntentRoutes(fastify, {
	createMessageIntent,
	decideMessageIntent,
	listMessageIntents,
});

await registerOpsRoutes(fastify, {
	getExecutionMetrics,
	pauseInstance,
	resumeInstance,
	pauseOrganization,
	resumeOrganization,
	getMessageIntentTimeline,
});

const playbook = new DefaultAgentPlaybook();
const agentOrchestrator = new AgentOrchestratorUseCase(
	conversationRepository,
	agents,
	slaEvaluator,
	playbook,
);
const createLead = new CreateLeadUseCase(leadRepository, idFactory);
const openConversationForLead = new OpenConversationForLeadUseCase(
	instanceRepository,
	conversationRepository,
	idFactory,
);
const startSdrFlow = new StartSdrFlowUseCase(
	createLead,
	openConversationForLead,
	agentOrchestrator,
	dispatch,
	leadRepository,
	conversationRepository,
);

await registerSdrFlowRoutes(fastify, {
	startSdrFlow,
	gateDecisions: gateDecisionRecorder,
});

const listInstances = new ListInstancesUseCase(instanceRepository);
const createInstance = new CreateInstanceUseCase(
	instanceRepository,
	reputationRepository,
	idFactory,
);
const getInstance = new GetInstanceUseCase(instanceRepository);
const connectInstance = new ConnectInstanceUseCase(instanceRepository, provider);
const getConnectionStatus = new GetInstanceConnectionStatusUseCase(
	instanceRepository,
	provider,
);
const getQRCode = new GetInstanceQRCodeUseCase(instanceRepository, provider);
const evaluateHealthOnDemand = new EvaluateInstanceHealthOnDemandUseCase(
	instanceRepository,
	evaluateInstanceHealth,
);

await registerInstanceRoutes(fastify, {
	listInstances,
	createInstance,
	getInstance,
	connectInstance,
	getConnectionStatus,
	getQRCode,
	evaluateHealthOnDemand,
});

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================

fastify.get("/", async () => {
	return {
		status: "ok",
		service: "WhatLead API",
		timestamp: new Date().toISOString(),
	};
});

fastify.get("/health", async () => {
	return { status: "healthy", uptime: process.uptime() };
});

fastify.get("/api/tenants/me", async (request, reply) => {
	const session = await auth.api.getSession({
		headers: request.headers as any,
	});

	if (!session) {
		return reply.status(401).send({ error: "UNAUTHORIZED" });
	}

	const userId = (session as any).user?.id as string | undefined;
	const activeOrgId = (session as any).session?.activeOrganizationId as string | undefined;

	const org =
		activeOrgId
			? await prisma.organization.findUnique({ where: { id: activeOrgId } })
			: userId
				? (
						await prisma.member.findFirst({
							where: { userId },
							include: { organization: true },
							orderBy: { createdAt: "asc" },
						})
					)?.organization ?? null
				: null;

	if (!org) {
		return reply.status(404).send({ error: "NO_TENANT" });
	}

	return reply.send({
		id: org.id,
		name: org.name,
		plan: "FREE",
		limits: {},
	});
});

// =============================================================================
// AUTHENTICATION ROUTES
// Rate limit mais restrito para auth endpoints
// =============================================================================

fastify.route({
	method: ["GET", "POST"],
	url: "/api/auth/*",
	config: {
		rateLimit: {
			max: 20, // 20 requests por minuto para auth
			timeWindow: "1 minute",
		},
	},
	async handler(request, reply) {
		try {
			// Construir URL completa
			const protocol = request.headers["x-forwarded-proto"] || "http";
			const host = request.headers["x-forwarded-host"] || request.headers.host;
			const url = new URL(request.url, `${protocol}://${host}`);

			// Converter headers do Fastify para Headers do Web API
			const headers = new Headers();
			Object.entries(request.headers).forEach(([key, value]) => {
				if (value) {
					if (Array.isArray(value)) {
						value.forEach((v) => headers.append(key, v));
					} else {
						headers.append(key, value);
					}
				}
			});

			// Criar Request do Web API
			const webRequest = new Request(url.toString(), {
				method: request.method,
				headers,
				body: request.body ? JSON.stringify(request.body) : undefined,
			});

			// Processar com Better Auth
			const response = await auth.handler(webRequest);

			// Transferir status e headers da resposta
			reply.status(response.status);
			response.headers.forEach((value, key) => {
				reply.header(key, value);
			});

			// Enviar body
			if (response.body) {
				const text = await response.text();
				return reply.send(text);
			}

			return reply.send(null);
		} catch (error) {
			const requestLogger = createRequestLogger(reply.request.id);
			requestLogger.error(
				{
					err: error,
					url: request.url,
					icon: "🚫",
					event: "auth_error"
				},
				"Authentication Error",
			);

			return reply.status(500).send({
				success: false,
				error: "Erro interno de autenticacao",
				code: "AUTH_FAILURE",
			});
		}
	},
});

// =============================================================================
// tRPC ROUTES
// =============================================================================

	await fastify.register(fastifyTRPCPlugin, {
		prefix: "/trpc",
		trpcOptions: {
			router: appRouter,
			createContext,
			onError({ path, error, input, ctx }) {
				const requestLogger = createRequestLogger(ctx?.req?.id);
				requestLogger.error(
					{
						path,
						code: error.code,
						userId: ctx?.user?.id,
						input: input ? JSON.stringify(input).substring(0, 500) : undefined,
						traceId: ctx?.traceId,
						userAgent: (ctx?.req as any)?.headers?.["user-agent"] || undefined,
						icon: "💥",
						event: "error"
					},
					`tRPC Error: ${error.message}`,
				);
			},
		} satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
	});

// =============================================================================
// AI ROUTES
// =============================================================================

interface AiRequestBody {
	id?: string;
	messages: UIMessage[];
}

fastify.route({
	method: "POST",
	url: "/ai",
	config: {
		rateLimit: {
			max: 10,
			timeWindow: "1 minute",
		},
	},
	async handler(request, reply) {
		const session = await auth.api.getSession({
			headers: request.headers as any,
		});
		if (!session) {
			return reply.status(401).send({
				success: false,
				error: "Nao autorizado",
				code: "UNAUTHORIZED",
			});
		}

		const { messages } = request.body as AiRequestBody;
	const model = wrapLanguageModel({
		model: google("gemini-2.5-flash"),
		middleware: devToolsMiddleware(),
	});
	const result = streamText({
		model,
		messages: await convertToModelMessages(messages),
	});

	return result.toUIMessageStreamResponse();
	},
});

// =============================================================================
// START SERVER
// =============================================================================

const start = async (): Promise<void> => {
	try {
		const port = Number(env.PORT);
		const host = "0.0.0.0"; // Escutar em todas as interfaces

		await fastify.listen({ port, host });

		instanceHealthCronJob.run().catch((err) => {
			serverLogger.error({ err, event: "instance_health_cron" }, "Instance health cron failed");
		});
		instanceHealthCronTimer = setInterval(() => {
			instanceHealthCronJob.run().catch((err) => {
				serverLogger.error({ err, event: "instance_health_cron" }, "Instance health cron failed");
			});
		}, INSTANCE_HEALTH_CRON_INTERVAL_MS);

		messageExecutorWorker.run().catch((err) => {
			serverLogger.error({ err, event: "message_executor_cron" }, "Message executor cron failed");
		});
		messageExecutorCronTimer = setInterval(() => {
			messageExecutorWorker.run().catch((err) => {
				serverLogger.error({ err, event: "message_executor_cron" }, "Message executor cron failed");
			});
		}, MESSAGE_EXECUTOR_CRON_INTERVAL_MS);

		serverLogger.info({
			port,
			host,
			environment: env.NODE_ENV,
			icon: "🚀",
			event: "server_start",
		}, "WhatLead API server started successfully");
	} catch (err) {
		serverLogger.error({ err }, "❌ Failed to start server");
		process.exit(1);
	}
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
	serverLogger.info({
		signal,
		icon: "🛑",
		event: "server_shutdown"
	}, "Received shutdown signal, shutting down gracefully...");

	try {
		if (instanceHealthCronTimer) {
			clearInterval(instanceHealthCronTimer);
			instanceHealthCronTimer = null;
		}
		if (messageExecutorCronTimer) {
			clearInterval(messageExecutorCronTimer);
			messageExecutorCronTimer = null;
		}
		await fastify.close();
		serverLogger.info({
			icon: "✅",
			event: "server_shutdown"
		}, "Server closed successfully");
		process.exit(0);
	} catch (err) {
		serverLogger.error({
			err,
			signal,
			icon: "❌",
			event: "server_error"
		}, "Error during shutdown");
		process.exit(1);
	}
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

start();

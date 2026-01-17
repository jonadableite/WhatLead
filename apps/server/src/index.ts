import { createContext } from "@WhatLead/api/context";
import { type AppRouter, appRouter } from "@WhatLead/api/routers/index";
import { auth } from "@WhatLead/auth";
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
import { AssignConversationUseCase } from "./application/conversation/assign-conversation.use-case";
import { ConversationEventPipelineUseCase } from "./application/conversation/conversation-event-pipeline.use-case";
import { ConversationRouter } from "./application/conversation/conversation-router";
import { ReplyIntentDispatcher } from "./application/conversation/reply-intent-dispatcher";
import { DispatchUseCase } from "./application/dispatch/dispatch.use-case";
import { PreDispatchGuard } from "./application/handlers/dispatch/pre-dispatch.guard";
import { WhatsAppWebhookApplicationHandler } from "./application/handlers/webhook/whatsapp-webhook.handler";
import { DelayedDispatchPort } from "./application/heater/delayed-dispatch-port";
import { GuardedDispatchPort } from "./application/heater/guarded-dispatch-port";
import { WhatsAppProviderFactory } from "./application/providers/whatsapp-provider-factory";
import { GetReputationTimelineUseCase } from "./application/use-cases/get-reputation-timeline.use-case";
import { InboundMessageUseCase } from "./application/use-cases/inbound-message.use-case";
import { IngestReputationSignalUseCase } from "./application/use-cases/ingest-reputation-signal.use-case";
import { OutboundMessageRecordedUseCase } from "./application/use-cases/outbound-message-recorded.use-case";
import { RecordReputationSignalUseCase } from "./application/use-cases/record-reputation-signal.use-case";
import { WarmupOrchestratorUseCase } from "./application/warmup/warmup-orchestrator.use-case";
import { DispatchPolicy } from "./domain/services/dispatch-policy";
import { InstanceReputationEvaluator } from "./domain/services/instance-reputation-evaluator";
import { EvaluateInstanceHealthUseCase } from "./domain/use-cases/evaluate-instance-health";
import { WhatsAppMessageDispatchAdapter } from "./infra/dispatch/whatsapp-message-dispatch-adapter";
import { LoggingDomainEventBus } from "./infra/event-bus/logging-domain-event-bus";
import { StaticWarmUpContentProvider } from "./infra/heater/static-warmup-content-provider";
import { StaticWarmUpTargetsProvider } from "./infra/heater/static-warmup-targets-provider";
import { WhatsAppProviderDispatchAdapter } from "./infra/heater/whatsapp-dispatch-adapter";
import { SignalBackedInstanceMetricRepository } from "./infra/metrics/signal-backed-instance-metric-repository";
import { registerTurboZapProvider } from "./infra/providers/whatsapp/turbozap/turbozap.provider";
import { InMemoryAgentRepository } from "./infra/repositories/in-memory-agent-repository";
import { InMemoryInstanceRepository } from "./infra/repositories/in-memory-instance-repository";
import { InMemoryInstanceReputationRepository } from "./infra/repositories/in-memory-instance-reputation-repository";
import { PrismaConversationRepository } from "./infra/repositories/prisma-conversation-repository";
import { PrismaMessageRepository } from "./infra/repositories/prisma-message-repository";
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
const instanceRepository = new InMemoryInstanceRepository("system", "TURBOZAP");
const reputationRepository = new InMemoryInstanceReputationRepository();
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

const conversationRepository = new PrismaConversationRepository();
const messageRepository = new PrismaMessageRepository();
const idFactory = { createId: () => randomUUID() };
const outboundMessageRecorded = new OutboundMessageRecordedUseCase(
	conversationRepository,
	messageRepository,
	idFactory,
);

const provider = WhatsAppProviderFactory.create("TURBOZAP", {
	baseUrl: env.TURBOZAP_BASE_URL,
	apiKey: env.TURBOZAP_API_KEY,
	timeoutMs: env.TURBOZAP_TIMEOUT_MS,
});

const dispatchPort = new WhatsAppProviderDispatchAdapter(provider);
const preDispatchGuard = new PreDispatchGuard(evaluateInstanceHealth);
const delayedDispatchPort = new DelayedDispatchPort(dispatchPort);
const guardedDispatchPort = new GuardedDispatchPort(
	delayedDispatchPort,
	preDispatchGuard,
);
const warmUpTargets = new StaticWarmUpTargetsProvider(env.WARMUP_TARGETS);
const warmUpContent = new StaticWarmUpContentProvider();

const timeline = new GetReputationTimelineUseCase(signalRepository);
const dispatchPolicy = new DispatchPolicy();
const messageDispatchPort = new WhatsAppMessageDispatchAdapter(provider);
const dispatch = new DispatchUseCase(
	instanceRepository,
	evaluateInstanceHealth,
	dispatchPolicy,
	messageDispatchPort,
	metricIngestion,
	timeline,
	outboundMessageRecorded,
);
const heater = new WarmupOrchestratorUseCase(
	evaluateInstanceHealth,
	warmUpTargets,
	warmUpContent,
	dispatch,
	guardedDispatchPort,
	metricIngestion,
	timeline,
);
fastify.decorate("heater", heater);

const inboundMessage = new InboundMessageUseCase({
	instanceRepository,
	conversationRepository,
	messageRepository,
	idFactory,
});
const agents = new InMemoryAgentRepository([]);
const router = new ConversationRouter(agents);
const assignConversation = new AssignConversationUseCase(conversationRepository);
const replyDispatcher = new ReplyIntentDispatcher(dispatch);
const ingestConversation = new ConversationEventPipelineUseCase(
	inboundMessage,
	outboundMessageRecorded,
	conversationRepository,
	instanceRepository,
	router,
	assignConversation,
	replyDispatcher,
);
const webhookEventHandler = new WhatsAppWebhookApplicationHandler(
	ingestConversation,
	ingestSignalWithLogging,
);

await registerWebhookRoutes(fastify, {
	eventHandler: webhookEventHandler,
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

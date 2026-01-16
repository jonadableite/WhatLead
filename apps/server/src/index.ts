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
import Fastify from "fastify";
import { WhatsAppWebhookApplicationHandler } from "./application/handlers/webhook/whatsapp-webhook.handler";
import { EvaluateInstanceHealthUseCase } from "./domain/use-cases/evaluate-instance-health";
import { InstanceReputationEvaluator } from "./domain/services/instance-reputation-evaluator";
import { LoggingDomainEventBus } from "./infra/event-bus/logging-domain-event-bus";
import { InMemoryMetricIngestion } from "./infra/metrics/in-memory-metric-ingestion";
import { InMemoryInstanceMetricRepository } from "./infra/metrics/in-memory-instance-metric-repository";
import { InMemoryMetricStore } from "./infra/metrics/in-memory-metric-store";
import { InMemoryInstanceReputationRepository } from "./infra/repositories/in-memory-instance-reputation-repository";
import { InMemoryInstanceRepository } from "./infra/repositories/in-memory-instance-repository";
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

const metricStore = new InMemoryMetricStore();
const metricIngestion = new InMemoryMetricIngestion(metricStore);
const metricRepository = new InMemoryInstanceMetricRepository(metricStore);
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
const webhookEventHandler = new WhatsAppWebhookApplicationHandler(
	metricIngestion,
	evaluateInstanceHealth,
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

fastify.post("/ai", async (request) => {
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

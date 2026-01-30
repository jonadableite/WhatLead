/**
 * WhatsApp Webhook Routes
 *
 * Fastify routes for receiving webhooks from WhatsApp providers.
 * Each provider has its own endpoint for payload transformation.
 *
 * ENDPOINTS:
 * - POST /webhooks/turbozap - TurboZap/WhatsMeow webhooks
 * - POST /webhooks/evolution - Evolution API webhooks (future)
 */

import prisma from "@WhatLead/db";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type {
  NormalizedWhatsAppEvent,
  WebhookEventHandler,
} from "../../application/event-handlers/webhook-event-handler";
import { turboZapTransformer } from "./handlers/turbozap.webhook-handler";

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for registering webhook routes.
 */
interface WebhookRoutesOptions {
	/**
	 * Handler that processes normalized events.
	 * If not provided, events are logged but not processed.
	 */
	eventHandler?: WebhookEventHandler;

	/**
	 * Optional secret for webhook verification.
	 */
	webhookSecret?: string;
}

/**
 * Registers WhatsApp webhook routes on the Fastify instance.
 *
 * @param fastify - Fastify instance
 * @param options - Route options
 */
export const registerWebhookRoutes = async (
	fastify: FastifyInstance,
	options: WebhookRoutesOptions = {},
): Promise<void> => {
	const { eventHandler, webhookSecret } = options;

	// ─────────────────────────────────────────────────────────────────────────
	// TURBOZAP WEBHOOK
	// ─────────────────────────────────────────────────────────────────────────

	fastify.post(
		"/webhooks/turbozap",
		async (request: FastifyRequest, reply: FastifyReply) => {
			const payload = request.body as Record<string, unknown>;
			const normalizedPayload = await resolveTurboZapInstance(payload);

			// Optional: Verify webhook secret
			if (webhookSecret) {
				const providedSecret = request.headers["x-webhook-secret"];
				if (providedSecret !== webhookSecret) {
					return reply.code(401).send({ error: "Invalid webhook secret" });
				}
			}

			// Transform TurboZap payload to normalized events
			const events = turboZapTransformer.transform(
				normalizedPayload as unknown as Parameters<
					typeof turboZapTransformer.transform
				>[0],
			);

			// Log events for debugging
			for (const event of events) {
				fastify.log.info(
					{
						provider: "TurboZap",
						eventType: event.type,
						instanceId: event.instanceId,
						messageId: event.messageId,
					},
					"Received webhook event",
				);
			}

			// Process events if handler is configured
			if (eventHandler) {
				await processEvents(events, eventHandler, fastify);
			}

			return reply.send({
				received: true,
				eventsProcessed: events.length,
			});
		},
	);

	// ─────────────────────────────────────────────────────────────────────────
	// EVOLUTION WEBHOOK (Placeholder for future implementation)
	// ─────────────────────────────────────────────────────────────────────────

	fastify.post(
		"/webhooks/evolution",
		async (_request: FastifyRequest, reply: FastifyReply) => {
			// TODO: Implement Evolution API webhook transformation
			fastify.log.warn("Evolution webhook received but not implemented");

			return reply.send({
				received: true,
				eventsProcessed: 0,
			});
		},
	);

	// ─────────────────────────────────────────────────────────────────────────
	// HEALTH CHECK
	// ─────────────────────────────────────────────────────────────────────────

	fastify.get(
		"/webhooks/health",
		async (_request: FastifyRequest, reply: FastifyReply) => {
			return reply.send({
				status: "ok",
				providers: ["turbozap", "evolution"],
			});
		},
	);
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Processes normalized events through the handler.
 * Errors are logged but don't fail the webhook response.
 */
const processEvents = async (
	events: NormalizedWhatsAppEvent[],
	handler: WebhookEventHandler,
	fastify: FastifyInstance,
): Promise<void> => {
	for (const event of events) {
		try {
			await handler.handle(event);
		} catch (error) {
			fastify.log.error(
				{
					error: error instanceof Error ? error.message : "Unknown error",
					eventType: event.type,
					instanceId: event.instanceId,
				},
				"Failed to process webhook event",
			);
		}
	}
};

// ═══════════════════════════════════════════════════════════════════════════
// PLUGIN EXPORT (for Fastify autoload)
// ═══════════════════════════════════════════════════════════════════════════

export default registerWebhookRoutes;

const resolveTurboZapInstance = async (
	payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
	const instanceId =
		typeof payload.instance_id === "string" ? payload.instance_id : undefined;
	if (instanceId) {
		const match = await prisma.instance.findUnique({
			where: { id: instanceId },
			select: { id: true },
		});
		if (match) {
			return payload;
		}
	}

	const instanceName =
		typeof payload.instance === "string"
			? payload.instance
			: typeof payload.instance_name === "string"
				? payload.instance_name
				: undefined;
	if (!instanceName) {
		return payload;
	}
	const trimmedInstanceName = instanceName.trim();
	if (!trimmedInstanceName) {
		return payload;
	}

	if (isUuid(trimmedInstanceName)) {
		const match = await prisma.instance.findUnique({
			where: { id: trimmedInstanceName },
			select: { id: true },
		});
		if (match) {
			return {
				...payload,
				instance_id: match.id,
			};
		}
	}

	const match = await prisma.instance.findFirst({
		where: {
			displayName: {
				equals: trimmedInstanceName,
				mode: "insensitive",
			},
		},
		select: { id: true },
	});
	if (!match) {
		return payload;
	}

	return {
		...payload,
		instance_id: match.id,
	};
};

const isUuid = (value: string): boolean =>
	/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
		value,
	);

import { InstanceHeatingPolicy } from "@/domain/policies/instance-heating-policy";
import type { EvaluateInstanceReputationUseCase } from "./evaluate-instance-reputation";
import type { WhatsAppProvider } from "../../application/providers/whatsapp-provider";

/**
 * Request DTO for getting heating limits.
 */
interface GetHeatingLimitsRequest {
	companyId: string;
	instanceId: string;
}

/**
 * Response DTO with heating limits.
 */
interface HeatingLimitsResponse {
	maxMessagesPerHour: number;
	maxMessagesPerDay: number;
	minDelayBetweenMessagesInSeconds: number;
	recommendedBatchSize: number;
	currentTemperature: string;
	canDispatch: boolean;
}

/**
 * Request DTO for sending a warming message.
 */
interface SendWarmingMessageRequest {
	companyId: string;
	instanceId: string;
	to: string;
	text: string;
	/** Optional: simulate typing before sending */
	simulateTyping?: boolean;
}

/**
 * Response DTO for warming message result.
 */
interface SendWarmingMessageResponse {
	success: boolean;
	messageId?: string;
	error?: string;
}

/**
 * HeaterUseCase - Orchestrates warming operations for WhatsApp instances.
 *
 * RESPONSIBILITIES:
 * - Evaluate instance reputation to determine safe limits
 * - Send warming messages through the provider (with human-like behavior)
 * - Ensure warming operations respect reputation constraints
 *
 * DESIGN:
 * - WhatsAppProvider is injected (domain doesn't know the engine)
 * - All intelligence is here, provider is "dumb"
 * - Respects rate limits determined by InstanceHeatingPolicy
 */
export class HeaterUseCase {
	constructor(
		private readonly evaluateReputationUseCase: EvaluateInstanceReputationUseCase,
		private readonly whatsappProvider?: WhatsAppProvider,
	) {}

	/**
	 * Gets the current heating limits for an instance.
	 * Use this to check what operations are safe before sending.
	 */
	async getHeatingLimits(
		request: GetHeatingLimitsRequest,
	): Promise<HeatingLimitsResponse> {
		const { instanceId, companyId } = request;

		// 1. Evaluate real reputation state
		const evaluationResult = await this.evaluateReputationUseCase.execute({
			instanceId,
			companyId,
		});

		const { temperatureLevel, canDispatch } = evaluationResult;

		// 2. Get limits based on temperature
		const limits = InstanceHeatingPolicy.getLimits(temperatureLevel);

		const recommendedBatchSize = Math.floor(limits.maxMessagesPerHour / 3);

		return {
			...limits,
			recommendedBatchSize,
			currentTemperature: temperatureLevel,
			canDispatch,
		};
	}

	/**
	 * Sends a warming message with human-like behavior.
	 *
	 * @throws Error if provider is not configured
	 * @throws Error if instance cannot dispatch (cooldown/overheated)
	 */
	async sendWarmingMessage(
		request: SendWarmingMessageRequest,
	): Promise<SendWarmingMessageResponse> {
		if (!this.whatsappProvider) {
			throw new Error(
				"WhatsAppProvider is required for sending warming messages",
			);
		}

		const { instanceId, companyId, to, text, simulateTyping } = request;

		// 1. Check if we can dispatch
		const limits = await this.getHeatingLimits({ instanceId, companyId });

		if (!limits.canDispatch) {
			return {
				success: false,
				error: `Instance cannot dispatch. Current temperature: ${limits.currentTemperature}`,
			};
		}

		// 2. Simulate typing if requested and supported
		if (simulateTyping && this.isPresenceCapable(this.whatsappProvider)) {
			await this.whatsappProvider.setPresence({
				instanceId,
				to,
				presence: "composing",
			});

			// Wait for realistic typing duration (1-3 seconds per 50 chars)
			const typingDuration = Math.min(
				3000,
				Math.max(1000, (text.length / 50) * 1000),
			);
			await this.delay(typingDuration);
		}

		// 3. Calculate delay based on temperature
		const delayMs = limits.minDelayBetweenMessagesInSeconds * 1000;

		// 4. Send the message
		const result = await this.whatsappProvider.sendText({
			instanceId,
			to,
			text,
			delayMs,
		});

		return {
			success: result.success,
			messageId: result.messageId,
			error: result.error,
		};
	}

	/**
	 * @deprecated Use getHeatingLimits instead.
	 * Kept for backward compatibility.
	 */
	async execute(
		request: GetHeatingLimitsRequest,
	): Promise<Omit<HeatingLimitsResponse, "canDispatch">> {
		const result = await this.getHeatingLimits(request);
		return {
			maxMessagesPerHour: result.maxMessagesPerHour,
			maxMessagesPerDay: result.maxMessagesPerDay,
			minDelayBetweenMessagesInSeconds: result.minDelayBetweenMessagesInSeconds,
			recommendedBatchSize: result.recommendedBatchSize,
			currentTemperature: result.currentTemperature,
		};
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// PRIVATE HELPERS
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Type guard for presence capability.
	 */
	private isPresenceCapable(
		provider: WhatsAppProvider,
	): provider is WhatsAppProvider & {
		setPresence: (params: {
			instanceId: string;
			to: string;
			presence: string;
		}) => Promise<void>;
	} {
		return "setPresence" in provider;
	}

	/**
	 * Promise-based delay utility.
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

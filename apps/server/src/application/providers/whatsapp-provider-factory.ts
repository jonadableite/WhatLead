/**
 * WhatsApp Provider Factory
 *
 * Creates provider instances based on engine type and configuration.
 * Enables per-instance or per-company engine selection.
 *
 * USAGE:
 * ```typescript
 * const provider = WhatsAppProviderFactory.create("TURBOZAP", {
 *   baseUrl: "http://localhost:8080",
 *   apiKey: "your-api-key"
 * });
 * ```
 */

import type { WhatsAppEngine } from "../../domain/value-objects/whatsapp-engine";
import type { WhatsAppProvider } from "./whatsapp-provider";
import type { ProviderConfig } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Registry of provider constructors.
 * Infrastructure layer registers providers here at startup.
 */
type ProviderConstructor = (config: ProviderConfig) => WhatsAppProvider;

const providerRegistry = new Map<WhatsAppEngine, ProviderConstructor>();

/**
 * Registers a provider implementation for an engine type.
 * Called by infrastructure layer during application bootstrap.
 *
 * @param engine - Engine type to register
 * @param constructor - Factory function that creates the provider
 */
export const registerProvider = (
	engine: WhatsAppEngine,
	constructor: ProviderConstructor,
): void => {
	providerRegistry.set(engine, constructor);
};

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Factory for creating WhatsApp provider instances.
 */
export const WhatsAppProviderFactory = {
	/**
	 * Creates a provider instance for the specified engine.
	 *
	 * @param engine - WhatsApp engine type (TURBOZAP, EVOLUTION)
	 * @param config - Provider configuration (baseUrl, apiKey)
	 * @returns Configured provider instance
	 * @throws Error if engine is not registered
	 */
	create(engine: WhatsAppEngine, config: ProviderConfig): WhatsAppProvider {
		const constructor = providerRegistry.get(engine);

		if (!constructor) {
			throw new Error(
				`WhatsApp provider not registered for engine: ${engine}. ` +
					`Available engines: ${[...providerRegistry.keys()].join(", ") || "none"}`,
			);
		}

		return constructor(config);
	},

	/**
	 * Checks if a provider is registered for the engine.
	 */
	isRegistered(engine: WhatsAppEngine): boolean {
		return providerRegistry.has(engine);
	},

	/**
	 * Gets list of registered engines.
	 */
	getRegisteredEngines(): WhatsAppEngine[] {
		return [...providerRegistry.keys()];
	},
};

// Re-export for convenience
export type { WhatsAppEngine, ProviderConfig };

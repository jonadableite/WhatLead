/**
 * Supported WhatsApp engine types.
 * This is the single source of truth for engine identification.
 *
 * TURBOZAP: WhatsMeow-based Go service (official WhatsApp Web protocol)
 * EVOLUTION: Evolution API (Baileys-based Node.js)
 */
export const WHATSAPP_ENGINES = ["TURBOZAP", "EVOLUTION"] as const;

export type WhatsAppEngine = (typeof WHATSAPP_ENGINES)[number];

/**
 * Validates if a string is a valid WhatsApp engine.
 */
export const isValidWhatsAppEngine = (value: string): value is WhatsAppEngine =>
	WHATSAPP_ENGINES.includes(value as WhatsAppEngine);

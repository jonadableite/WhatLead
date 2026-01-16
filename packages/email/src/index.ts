import { env } from "@WhatLead/env/server";
import type { SendMailOptions } from "nodemailer";

import {
	closeTransporter,
	getTransporter,
	verifyConnection,
} from "./transport";

export interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
	text?: string;
	replyTo?: string;
}

export interface SendEmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Aguarda um tempo especificado (para retry com backoff)
 */
const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Envia um email usando SMTP com retry automático
 *
 * @param params - Parâmetros do email (to, subject, html, text opcional)
 * @returns Resultado do envio com sucesso/erro
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: "user@example.com",
 *   subject: "Bem-vindo ao WhatLead",
 *   html: "<h1>Olá!</h1>",
 * });
 * ```
 */
export const sendEmail = async (
	params: SendEmailParams,
): Promise<SendEmailResult> => {
	const { to, subject, html, text, replyTo } = params;

	const mailOptions: SendMailOptions = {
		from: {
			name: "WhatLead",
			address: env.SMTP_SENDER_EMAIL,
		},
		to,
		subject,
		html,
		text: text || stripHtml(html),
		replyTo: replyTo || env.SMTP_SENDER_EMAIL,
		headers: {
			"X-Priority": "1",
			"X-Mailer": "WhatLead Mailer",
		},
	};

	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			const transporter = getTransporter();
			const info = await transporter.sendMail(mailOptions);

			console.log(
				`[Email] Sent successfully to ${to} (messageId: ${info.messageId})`,
			);

			return {
				success: true,
				messageId: info.messageId,
			};
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			console.error(
				`[Email] Attempt ${attempt}/${MAX_RETRIES} failed for ${to}:`,
				lastError.message,
			);

			if (attempt < MAX_RETRIES) {
				// Exponential backoff: 1s, 2s, 4s
				const delay = RETRY_DELAY_MS * 2 ** (attempt - 1);
				await sleep(delay);
			}
		}
	}

	console.error(`[Email] All ${MAX_RETRIES} attempts failed for ${to}`);

	return {
		success: false,
		error: lastError?.message || "Failed to send email after multiple attempts",
	};
};

/**
 * Remove tags HTML para criar versão texto do email
 */
const stripHtml = (html: string): string => {
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
};

// Re-export utilities
export { closeTransporter, verifyConnection };

import { createTransport, type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "@WhatLead/env/server";

let transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

/**
 * Cria e retorna o transporter SMTP configurado para Zoho Mail
 * Utiliza connection pooling para melhor performance
 */
export const getTransporter =
	(): Transporter<SMTPTransport.SentMessageInfo> => {
		if (transporter) {
			return transporter;
		}

		const isAuthDisabled = env.SMTP_AUTH_DISABLED;

		transporter = createTransport({
			host: env.SMTP_HOST,
			port: env.SMTP_PORT,
			secure: env.SMTP_PORT === 465, // true para 465, false para outras portas
			auth: isAuthDisabled
				? undefined
				: {
						user: env.SMTP_USERNAME,
						pass: env.SMTP_PASSWORD,
					},
			pool: true, // Habilita connection pooling
			maxConnections: 5,
			maxMessages: 100,
			rateDelta: 1000, // 1 segundo entre mensagens
			rateLimit: 10, // máximo 10 mensagens por rateDelta
			// Configurações de segurança TLS
			tls: {
				rejectUnauthorized: true, // Rejeita certificados inválidos
				minVersion: "TLSv1.2",
			},
		});

		return transporter;
	};

/**
 * Verifica a conexão SMTP
 * Útil para health checks
 */
export const verifyConnection = async (): Promise<boolean> => {
	try {
		const transport = getTransporter();
		await transport.verify();
		return true;
	} catch (error) {
		console.error("[Email] SMTP connection verification failed:", error);
		return false;
	}
};

/**
 * Fecha o pool de conexões
 * Útil para graceful shutdown
 */
export const closeTransporter = (): void => {
	if (transporter) {
		transporter.close();
		transporter = null;
	}
};

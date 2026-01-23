import prisma from "@WhatLead/db";
import { sendEmail } from "@WhatLead/email";
import {
  invitationTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "@WhatLead/email/templates";
import { env } from "@WhatLead/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";

/**
 * WhatLead Authentication Configuration
 *
 * Plugins habilitados:
 * - Admin: Gestão de usuários, banimento, roles
 * - Organization: Multi-tenancy com teams
 *
 * Features de segurança:
 * - Email verification obrigatório
 * - Password reset via email
 * - Rate limiting interno
 * - Session management com expiração
 * - Cookies httpOnly, secure, sameSite
 */
export const auth = betterAuth({
	appName: "WhatLead",
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,

	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),

	trustedOrigins: [env.CORS_ORIGIN],

	// ==========================================================================
	// EMAIL & PASSWORD AUTHENTICATION
	// ==========================================================================
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		autoSignIn: false, // Não auto-login após registro (precisa verificar email)
		minPasswordLength: 8,
		maxPasswordLength: 128,

		// Callback para envio de email de reset de senha
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: "Redefina sua senha - WhatLead",
				html: resetPasswordTemplate({
					name: user.name,
					url,
				}),
			});
		},
	},

	// ==========================================================================
	// EMAIL VERIFICATION
	// ==========================================================================
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			const verificationUrl = new URL(url);
			const token = verificationUrl.searchParams.get("token") ?? "";
			const callbackURL = verificationUrl.searchParams.get("callbackURL");
			const webUrl = new URL("/verify-email", env.CORS_ORIGIN);
			if (token) webUrl.searchParams.set("token", token);
			if (callbackURL) webUrl.searchParams.set("callbackURL", callbackURL);
			webUrl.searchParams.set("email", user.email);

			await sendEmail({
				to: user.email,
				subject: "Confirme seu email - WhatLead",
				html: verifyEmailTemplate({
					name: user.name,
					url: webUrl.toString(),
				}),
			});
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		expiresIn: 60 * 60 * 24, // 24 horas
	},

	// ==========================================================================
	// SESSION CONFIGURATION
	// ==========================================================================
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 dias
		updateAge: 60 * 60 * 24, // Atualiza a cada 24h
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // Cache de 5 minutos
		},
	},

	// ==========================================================================
	// RATE LIMITING (Internal)
	// ==========================================================================
	rateLimit: {
		enabled: true,
		window: 60, // 1 minuto
		max: 10, // 10 requests por minuto
	},

	// ==========================================================================
	// ACCOUNT CONFIGURATION
	// ==========================================================================
	account: {
		accountLinking: {
			enabled: false, // Desabilitado por enquanto (sem OAuth)
		},
	},

	// ==========================================================================
	// ADVANCED SECURITY OPTIONS
	// ==========================================================================
	advanced: {
		defaultCookieAttributes: {
			sameSite: env.NODE_ENV === "production" ? "none" : "lax",
			secure: env.NODE_ENV === "production",
			httpOnly: true,
			path: "/",
		},
	},

	// ==========================================================================
	// PLUGINS
	// ==========================================================================
	plugins: [
		// ========================================================================
		// ADMIN PLUGIN
		// Permite gestão de usuários por administradores
		// ========================================================================
		admin({
			defaultRole: "user",
			adminRoles: ["admin"],
		}),

		// ========================================================================
		// ORGANIZATION PLUGIN
		// Multi-tenancy com suporte a teams
		// ========================================================================
		organization({
			// Habilita Teams para divisão interna (Vendas, Suporte, etc.)
			teams: {
				enabled: true,
			},

			// Limite de membros por organização (plano inicial)
			membershipLimit: 10,

			// Callback para envio de convites
			async sendInvitationEmail({
				email,
				organization: org,
				inviter,
				role,
				invitation,
			}) {
				const maybeToken = (invitation as { token?: unknown }).token;
				const invitationToken =
					typeof maybeToken === "string" && maybeToken
						? maybeToken
						: invitation.id;

				const inviteUrl = new URL(
					`/invite/${invitationToken}`,
					env.CORS_ORIGIN,
				);

				await sendEmail({
					to: email,
					subject: `Voce foi convidado para ${org.name} - WhatLead`,
					html: invitationTemplate({
						organizationName: org.name,
						inviterName: inviter.user.name,
						role,
						url: inviteUrl.toString(),
					}),
				});
			},

			// Expiração de convites: 7 dias
			invitationExpiresIn: 60 * 60 * 24 * 7,

			// Permitir que usuários criem organizações
			allowUserToCreateOrganization: true,
		}),
	],
});

// Export types para uso em outros pacotes
export type Auth = typeof auth;

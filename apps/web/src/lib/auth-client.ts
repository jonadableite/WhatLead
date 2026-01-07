import { env } from "@WhatLead/env/web";
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

/**
 * WhatLead Auth Client
 *
 * Cliente de autenticação configurado com plugins:
 * - adminClient: Funcionalidades de administração (gestão de usuários)
 * - organizationClient: Multi-tenancy e teams
 */
export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
	plugins: [adminClient(), organizationClient()],
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Tipo da sessão do usuário
 * Inclui dados do usuário e informações de autenticação
 */
export type Session = typeof authClient.$Infer.Session;

/**
 * Tipo do usuário autenticado
 */
export type User = Session["user"];

// =============================================================================
// HOOKS EXPORTS (Re-export para conveniência)
// =============================================================================

/**
 * Hook para obter e gerenciar a sessão do usuário
 * @example
 * ```tsx
 * const { data: session, isPending } = useSession();
 * ```
 */
export const useSession = authClient.useSession;

/**
 * Hook para listar organizações do usuário
 * @example
 * ```tsx
 * const { data: orgs } = useListOrganizations();
 * ```
 */
export const useListOrganizations = authClient.useListOrganizations;

/**
 * Hook para obter a organização ativa
 * @example
 * ```tsx
 * const { data: activeOrg } = useActiveOrganization();
 * ```
 */
export const useActiveOrganization = authClient.useActiveOrganization;

// =============================================================================
// ACTION EXPORTS (Re-export para conveniência)
// =============================================================================

/**
 * Fazer logout do usuário
 * @example
 * ```tsx
 * await signOut();
 * ```
 */
export const signOut = authClient.signOut;

/**
 * Fazer login com email e senha
 * @example
 * ```tsx
 * await signIn.email({ email, password });
 * ```
 */
export const signIn = authClient.signIn;

/**
 * Criar nova conta
 * @example
 * ```tsx
 * await signUp.email({ email, password, name });
 * ```
 */
export const signUp = authClient.signUp;

/**
 * Solicitar reset de senha
 * @example
 * ```tsx
 * await forgetPassword({ email });
 * ```
 */
export const forgetPassword = authClient.forgetPassword;

/**
 * Redefinir senha com token
 * @example
 * ```tsx
 * await resetPassword({ token, newPassword });
 * ```
 */
export const resetPassword = authClient.resetPassword;

/**
 * Verificar email com token
 * @example
 * ```tsx
 * await verifyEmail({ token });
 * ```
 */
export const verifyEmail = authClient.verifyEmail;

/**
 * Reenviar email de verificação
 * @example
 * ```tsx
 * await sendVerificationEmail({ email });
 * ```
 */
export const sendVerificationEmail = authClient.sendVerificationEmail;

// =============================================================================
// ORGANIZATION EXPORTS
// =============================================================================

/**
 * Operações de organização
 */
export const organization = authClient.organization;

// =============================================================================
// ADMIN EXPORTS
// =============================================================================

/**
 * Operações administrativas (requer role admin)
 */
export const admin = authClient.admin;

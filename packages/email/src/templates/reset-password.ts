import { baseTemplate } from "./base";

export interface ResetPasswordParams {
	name: string;
	url: string;
}

/**
 * Template de email para redefinição de senha
 * Enviado quando o usuário solicita recuperação de senha
 */
export const resetPasswordTemplate = ({
	name,
	url,
}: ResetPasswordParams): string => {
	const firstName = name.split(" ")[0];

	const content = `
    <div class="content">
      <h1 class="greeting">Ola, ${firstName}!</h1>
      
      <p class="message">
        Recebemos uma solicitacao para redefinir a senha da sua conta no <strong>WhatLead</strong>.
      </p>
      
      <p class="message">
        Esqueceu sua senha? Sem problemas! Clique no botao abaixo para criar uma nova:
      </p>
      
      <div class="button-container">
        <a href="${url}" class="button" target="_blank">
          Redefinir minha senha
        </a>
      </div>
      
      <div class="note">
        <strong>Importante:</strong><br>
        Este link expira em <strong>1 hora</strong> por motivos de seguranca.
        Se voce nao solicitou a redefinicao de senha, ignore este email - sua senha permanecera a mesma.
      </div>
      
      <p class="message" style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        Se o botao nao funcionar, copie e cole este link no seu navegador:<br>
        <a href="${url}" style="color: #1e1b4a; word-break: break-all;">${url}</a>
      </p>
      
      <p class="message" style="margin-top: 16px; padding: 12px; background-color: #fef3c7; border-radius: 8px; font-size: 14px; color: #92400e;">
        <strong>Dica de seguranca:</strong> Nunca compartilhe este link com ninguem. Nossa equipe nunca pedira sua senha.
      </p>
    </div>
  `;

	return baseTemplate({
		previewText: `${firstName}, redefina sua senha do WhatLead`,
		content,
	});
};

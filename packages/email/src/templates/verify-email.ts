import { baseTemplate } from "./base";

export interface VerifyEmailParams {
	name: string;
	url: string;
}

/**
 * Template de email para verificação de email
 * Enviado após o cadastro do usuário
 */
export const verifyEmailTemplate = ({
	name,
	url,
}: VerifyEmailParams): string => {
	const firstName = name.split(" ")[0];

	const content = `
    <div class="content">
      <h1 class="greeting">Ola, ${firstName}!</h1>
      
      <p class="message">
        Bem-vindo ao <strong>WhatLead</strong>! Estamos muito felizes em ter voce conosco.
      </p>
      
      <p class="message">
        Para comecar a transformar suas conversas em vendas, confirme seu email clicando no botao abaixo:
      </p>
      
      <div class="button-container">
        <a href="${url}" class="button" target="_blank">
          Confirmar meu email
        </a>
      </div>
      
      <div class="note">
        <strong>Nao solicitou este cadastro?</strong><br>
        Se voce nao criou uma conta no WhatLead, pode ignorar este email com seguranca.
        Este link expira em 24 horas.
      </div>
      
      <p class="message" style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        Se o botao nao funcionar, copie e cole este link no seu navegador:<br>
        <a href="${url}" style="color: #1e1b4a; word-break: break-all;">${url}</a>
      </p>
    </div>
  `;

	return baseTemplate({
		previewText: `${firstName}, confirme seu email para comecar a usar o WhatLead`,
		content,
	});
};

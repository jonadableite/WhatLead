import { baseTemplate } from "./base";

export interface InvitationParams {
	organizationName: string;
	inviterName: string;
	role: string;
	url: string;
}

/**
 * Mapeamento de roles técnicos para nomes amigáveis
 */
const roleDisplayNames: Record<string, string> = {
	owner: "Proprietario",
	admin: "Gestor",
	member: "Colaborador",
};

/**
 * Template de email para convite de organização
 * Enviado quando um membro é convidado para uma organização
 */
export const invitationTemplate = ({
	organizationName,
	inviterName,
	role,
	url,
}: InvitationParams): string => {
	const roleDisplay = roleDisplayNames[role] || role;
	const inviterFirstName = inviterName.split(" ")[0];

	const content = `
    <div class="content">
      <h1 class="greeting">Voce foi convidado!</h1>
      
      <p class="message">
        <strong>${inviterFirstName}</strong> convidou voce para fazer parte do time 
        <strong>${organizationName}</strong> no <strong>WhatLead</strong>.
      </p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Seu papel na equipe sera:</p>
        <p style="margin: 0; font-size: 20px; font-weight: 600; color: #1e1b4a;">${roleDisplay}</p>
      </div>
      
      <p class="message">
        Aceite o convite e comece a colaborar com sua equipe para transformar conversas em vendas!
      </p>
      
      <div class="button-container">
        <a href="${url}" class="button" target="_blank">
          Aceitar convite
        </a>
      </div>
      
      <div class="note">
        <strong>Sobre este convite:</strong><br>
        Este convite foi enviado por ${inviterName} e expira em <strong>7 dias</strong>.
        Se voce nao conhece esta pessoa ou organizacao, pode ignorar este email.
      </div>
      
      <p class="message" style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        Se o botao nao funcionar, copie e cole este link no seu navegador:<br>
        <a href="${url}" style="color: #1e1b4a; word-break: break-all;">${url}</a>
      </p>
    </div>
  `;

	return baseTemplate({
		previewText: `${inviterFirstName} convidou voce para ${organizationName} no WhatLead`,
		content,
	});
};

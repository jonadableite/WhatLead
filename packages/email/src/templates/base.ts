/**
 * Template base para todos os emails do WhatLead
 * Design responsivo com suporte a dark mode
 */

export interface BaseTemplateParams {
	previewText?: string;
	content: string;
}

export const baseTemplate = ({
	previewText,
	content,
}: BaseTemplateParams): string => {
	return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>WhatLead</title>
  ${previewText ? `<meta name="description" content="${previewText}">` : ""}
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    
    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #1B1B1F;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .email-body {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    
    .header {
      background: linear-gradient(135deg, #1e1b4a 0%, #2d2a5e 100%);
      padding: 32px 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 40px;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1B1B1F;
      margin: 0 0 16px 0;
    }
    
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #4a4a4a;
      margin: 0 0 24px 0;
    }
    
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    
    .button {
      display: inline-block;
      background-color: #1e1b4a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      transition: background-color 0.2s;
    }
    
    .button:hover {
      background-color: #2d2a5e;
    }
    
    .note {
      font-size: 14px;
      color: #6b7280;
      margin: 24px 0 0 0;
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #1e1b4a;
    }
    
    .footer {
      background-color: #f9fafb;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 8px 0;
    }
    
    .footer-tagline {
      font-size: 13px;
      color: #1e1b4a;
      font-weight: 500;
      margin: 0 0 16px 0;
    }
    
    .footer-legal {
      font-size: 12px;
      color: #9ca3af;
      margin: 0;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-body {
        background-color: #2d2d32 !important;
      }
      .content {
        background-color: #2d2d32 !important;
      }
      .greeting {
        color: #ffffff !important;
      }
      .message {
        color: #d1d5db !important;
      }
      .note {
        background-color: #3d3d42 !important;
        color: #9ca3af !important;
      }
      .footer {
        background-color: #252528 !important;
        border-top-color: #3d3d42 !important;
      }
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .header {
        padding: 24px 20px !important;
      }
      .content {
        padding: 24px 20px !important;
      }
      .footer {
        padding: 24px 20px !important;
      }
      .greeting {
        font-size: 20px !important;
      }
      .button {
        padding: 14px 32px !important;
        font-size: 15px !important;
      }
    }
  </style>
</head>
<body>
  <!-- Preview text (hidden) -->
  ${previewText ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ""}
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1B1B1F;">
    <tr>
      <td style="padding: 40px 20px;">
        <div class="email-container">
          <div class="email-body">
            <!-- Header -->
            <div class="header">
              <span class="logo">WhatLead</span>
            </div>
            
            <!-- Content -->
            ${content}
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-tagline">Transforme conversas em receita</p>
              <p class="footer-text">&copy; ${new Date().getFullYear()} WhatLead. Todos os direitos reservados.</p>
              <p class="footer-legal">
                Este email foi enviado automaticamente. Se você nao solicitou esta mensagem, pode ignora-la com seguranca.
              </p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
};

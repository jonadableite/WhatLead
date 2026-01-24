# Implementação de Header Premium 3D/Glassmorphism

O agente de UI especializado já preparou as alterações para transformar o cabeçalho em um componente de alta fidelidade visual.

## 1. Novo Design do Header (`header.tsx`)
- **Estilo Glassmorphism**: Aplicação de `backdrop-blur-xl` e `bg-background/60` para efeito de vidro fosco moderno.
- **Efeito 3D**: Adição de bordas sutis (`border-white/10`) e sombras suaves para profundidade.
- **Título Dinâmico**: Lógica automática para exibir "Dashboard", "CRM & Leads", etc., baseada na URL atual.
- **Barra de Progresso Visual**: Detalhe em gradiente (Indigo/Purple) ao lado do título para toque premium.

## 2. Refatoração do Menu de Usuário (`user-menu.tsx`)
- **Visualização Expandida (Desktop)**: Agora exibe **Nome** e **Email** ao lado do avatar, melhorando a UX.
- **Responsividade**: Em mobile, recolhe automaticamente para mostrar apenas o Avatar, economizando espaço.
- **Fallback Elegante**: Se não houver foto, exibe as iniciais sobre um fundo gradiente.
- **Interatividade**: Efeitos de hover e transição suaves (`duration-200`) em todo o componente.

## 3. Integração Técnica
- Uso de `usePathname` do Next.js para títulos.
- Integração com `authClient.useSession()` para dados reais do usuário.
- Manutenção de todas as funcionalidades de Logout e navegação existentes.

**O código já foi atualizado para refletir essas mudanças.** Por favor, confirme para finalizar a tarefa.

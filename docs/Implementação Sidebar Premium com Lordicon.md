# Plano de Implementação de Sidebar Premium

Este plano descreve a criação de uma sidebar responsiva, moderna e interativa, inspirada no estilo "Workly" e utilizando animações Lordicon.

## 1. Preparação do Ambiente
- Validar instalação de `lottie-web` (já presente em `apps/web/package.json`).
- Garantir que os arquivos JSON dos ícones estejam acessíveis.

## 2. Componente `AnimatedIcon`
Criar um componente reutilizável em `apps/web/src/components/ui/animated-icon.tsx` para encapsular a lógica do Lordicon/Lottie.
- **Funcionalidade:**
  - Receber o `iconData` (JSON) como prop.
  - Tocar animação no `mouseenter` (hover).
  - Parar/Resetar animação no `mouseleave`.
  - Suportar troca de cores via CSS/props se necessário (embora JSONs geralmente tenham cores fixas, podemos tentar colorizar ou usar filtros CSS).

## 3. Componente `Sidebar`
Criar `apps/web/src/components/sidebar.tsx` com a estrutura visual solicitada.
- **Design (Workly Style):**
  - Fundo escuro (Dark mode default).
  - Item ativo com gradiente Indigo/Purple e brilho.
  - Tipografia limpa e espaçamento generoso.
- **Responsividade:**
  - **Desktop:** Barra lateral fixa à esquerda.
  - **Mobile:** Drawer (Sheet) que desliza da esquerda, ativado por um botão de menu no topo.
- **Conteúdo:**
  - Logo "WhatLead" no topo.
  - Barra de busca (Search) estilizada.
  - Seções de Navegação mapeadas com os ícones Lordicon:
    - Dashboard, CRM/Leads, AI, Campaigns, Organization, Settings.
  - Rodapé com card "Boost with AI / Upgrade to Pro".

## 4. Integração no Layout
Atualizar `apps/web/src/app/(dashboard)/layout.tsx`.
- Adicionar o componente `<Sidebar />`.
- Ajustar o layout principal para ter margem à esquerda no desktop (`md:pl-72`) acomodando a sidebar fixa.
- Garantir que o `Header` existente (refatorado anteriormente) se integre harmoniosamente (talvez movendo-o para dentro do fluxo principal ou ajustando sua largura).

## 5. Mapeamento de Assets
Confirmar os caminhos dos arquivos JSON para importação dinâmica ou estática no `Sidebar`.

**Execução:**
1. Criar `AnimatedIcon`.
2. Criar `Sidebar`.
3. Atualizar `Layout`.

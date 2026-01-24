# Plano de Implementação: Leads e Conversas (CRM)

Este plano cobre a criação das rotas de API e interfaces de usuário para gerenciar Leads e Conversas, com foco em transparência e estado do funil, conforme solicitado.

## 1. Backend (API com tRPC)
Vamos criar dois novos routers no pacote `@WhatLead/api`: `lead.ts` e `conversation.ts`.

### 1.1 Router de Leads (`packages/api/src/routers/lead.ts`)
-   **`list`**: Retorna leads paginados, com filtros por estágio e busca por nome/email. Inclui a relação com a última conversa para mostrar "Última atividade".
-   **`get`**: Retorna detalhes de um lead específico.
-   **`create`**: Criação manual de lead (opcional para agora, mas bom ter).
-   **`updateStage`**: Atualiza o estágio do lead no funil.

### 1.2 Router de Conversas (`packages/api/src/routers/conversation.ts`)
-   **`get`**: Retorna detalhes da conversa, incluindo mensagens, SLA e metadados de quem agiu.
-   **`listByLead`**: Retorna histórico de conversas de um lead.
-   **`getMessages`**: Retorna mensagens de uma conversa específica.

### 1.3 Atualização do Router Principal (`packages/api/src/routers/index.ts`)
-   Registrar `leadRouter` e `conversationRouter`.

## 2. Frontend (Next.js + SWR/tRPC)

### 2.1 Tela de Leads (`/crm`)
Criar `apps/web/src/app/(dashboard)/crm/page.tsx` e componentes relacionados.
-   **Visualização**: Tabela ou Kanban (vamos focar em Lista Detalhada inicialmente para "entender o estado").
-   **Colunas**:
    -   Nome/Contato.
    -   **Stage (Badge Visual)**: Cores distintas para cada fase (ex: Novo = Azul, Negociação = Amarelo, Fechado = Verde).
    -   **Última Atividade**: Data relativa ("há 2 horas") baseada em `lastMessageAt` da conversa vinculada.
    -   **Última Conversa**: Trecho da última mensagem ou status.
-   **Interação**: Clique leva para detalhes ou abre drawer de conversa.

### 2.2 Tela de Conversa Detalhada (`/conversations/[id]`)
Criar `apps/web/src/app/(dashboard)/conversations/[id]/page.tsx` (ou modal/drawer).
-   **Header**: Status da conversa, SLA (tempo restante ou "breached"), quem está atribuído.
-   **Timeline de Mensagens**:
    -   Diferenciação visual: Mensagem de Cliente (Esq), Agente (Dir), Sistema (Centro/Cinza).
    -   **Badges de Ator**: "AI Agent", "Human Operator", "System Automation".
    -   **Gate Decision**: Se houver bloqueio ou delay, mostrar um card explicativo na timeline ("Mensagem bloqueada por política X").
-   **Sidebar de Contexto**: Dados do Lead, ActorContext (o que a IA sabia naquele momento).

## 3. Integração e Estado (SWR/tRPC)
-   Usaremos `trpc.lead.list.useQuery` para alimentar a lista.
-   `trpc.conversation.get.useQuery` para a tela de detalhes.
-   Invalidar queries ao mudar estágios para refletir "Última atividade" instantaneamente.

## Critérios de Aceite (Checklist)
- [ ] Lista de leads mostra Stage e última atividade claramente.
- [ ] Detalhe da conversa mostra quem enviou cada mensagem (Agent/User/System).
- [ ] SLA e Status da conversa visíveis.
- [ ] Explicação visual de decisões de gate (transparência).

**Atenção:** Como o banco de dados já possui os modelos (`Lead`, `Conversation`, `Message`), focaremos na camada de API e UI.

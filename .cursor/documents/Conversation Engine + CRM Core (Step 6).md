## Diagnóstico (estado real do repositório hoje)
- Já existe um **Conversation Core inicial**:
  - `Conversation` (status: OPEN|ASSIGNED|CLOSED; `lastMessageAt`, `isActive`): [conversation.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/entities/conversation.ts)
  - `Message` (direction/type/sentBy; persistido): [message.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/entities/message.ts)
  - Prisma `Conversation`/`Message` mínimos: [conversation.prisma](file:///d:/Projeto/WhatLead/packages/db/prisma/schema/conversation.prisma)
  - Pipeline inbound/outbound básico via webhook: [IngestConversationEventUseCase](file:///d:/Projeto/WhatLead/apps/server/src/application/use-cases/ingest-conversation-event.use-case.ts)
- O que falta para virar **Conversation Engine + CRM Domain** (seu Step 6):
  - estado vivo (WAITING/LOST + stage + contadores e timestamps separados)
  - sentBy contemplando **CONTACT**
  - regras de roteamento/atribuição (Agent/SDR/Bot) sem UI
  - inbound como use case espelho do Dispatch (com sinais de negócio)

## Objetivo do Step 6 (agora)
- Evoluir o Conversation Core existente para um **Conversation Engine governado**, com:
  - `Conversation` como estado vivo (não log)
  - `ConversationMessage` (histórico) consistente
  - `InboundMessageUseCase` (espelho do DispatchUseCase)
  - `Agent` mínimo + `ConversationRouter` (decide intenção, não envia)
  - Integração: Router gera intenção → **sempre passa pelo DispatchUseCase**

## Entregáveis

### 1) Domain: Conversation (estado vivo) + VO de estágio/status
- Alterar `ConversationStatus` para: `OPEN | WAITING | CLOSED | LOST`.
- Introduzir `ConversationStage`: `LEAD | QUALIFIED | PROPOSAL | WON | LOST`.
- Evoluir `Conversation` para armazenar e manter invariantes:
  - `lastInboundAt`, `lastOutboundAt`, `unreadCount`
  - `metadata` (tags/source/campaignId?) como estrutura controlada
- Métodos (comportamento explícito):
  - `receiveInboundMessage(...)` (incrementa unread, atualiza lastInboundAt)
  - `recordOutboundMessage(...)` (atualiza lastOutboundAt)
  - `markAsWaiting()` / `assignAgent(agentId)` / `advanceStage(nextStage)` / `close(reason)`

### 2) Domain: ConversationMessage (entity interna) e sentBy
- Renomear o conceito `Message` do domínio para `ConversationMessage` (ou manter nome e ajustar semântica) e:
  - acrescentar `sentBy: INSTANCE | AGENT | CONTACT | BOT`
  - manter `providerMessageId` + `occurredAt` como idempotência/ordenação

### 3) Prisma: expandir models Conversation/Message
- Atualizar [conversation.prisma](file:///d:/Projeto/WhatLead/packages/db/prisma/schema/conversation.prisma) com colunas:
  - `status`, `stage`, `lastInboundAt`, `lastOutboundAt`, `unreadCount`, `metadata Json?`
  - manter `isActive` + constraint “uma ativa por (instanceId+contactId)”
- Atualizar model `Message` (ou renomear para `conversation_message`) com:
  - `sentBy` adicionando CONTACT
- Rodar `db:generate` (e migração se o repo já estiver usando migrations em ambiente real)

### 4) Application: InboundMessageUseCase (espelho do Dispatch)
- Substituir/refatorar `IngestConversationEventUseCase` para um pipeline mais explícito:
  - `InboundMessageUseCase.execute(normalizedEvent)`:
    - resolve instance/contact
    - find/create conversation ativa
    - chama `conversation.receiveInboundMessage(...)`
    - persiste conversation + message
    - emite eventos de domínio (ex.: `ConversationActivated`, `ResponseReceived`) para logging/telemetria
  - `OutboundMessageRecordedUseCase` (opcional agora): registra outbound quando chegar `MESSAGE_SENT` via webhook (ou quando o DispatchUseCase produzir events)

### 5) Domain: Agent mínimo + regras básicas
- Criar `Agent` Entity:
  - `id`, `organizationId`, `role: SDR|CLOSER|BOT`, `status: ONLINE|OFFLINE`
- Regras mínimas (sem UI):
  - conversa só pode ter 1 agente ativo
  - instância de purpose WARMUP nunca roteia inbound para SDR humano

### 6) Application: ConversationRouter (não envia)
- `ConversationRouter.evaluate(conversation, inboundEvent)` → `RoutingDecision`:
  - `assignAgentId?`
  - `autoReplyIntent?` (intenção de resposta)
  - `markWaiting?`
- Um `AssignConversationUseCase` simples aplica a decisão (persistência).
- Quando houver `autoReplyIntent`, ele vira `DispatchRequest` e passa no **DispatchUseCase**.

### 7) Wiring
- No handler de webhook:
  - manter Normalized event
  - chamar `InboundMessageUseCase` antes/depois de reputação (ordem não crítica)
- Opcional: integrar também com outbound produzido pelo DispatchUseCase (para garantir consistência mesmo sem webhook “sent”).

## Testes (critério de “feito”)
- `Conversation.receiveInboundMessage` atualiza `lastInboundAt` e `unreadCount`.
- `ConversationRouter`:
  - inbound em instância WARMUP → não atribui SDR
  - inbound em stage LEAD → sugere SDR
- `InboundMessageUseCase`:
  - cria conversation no primeiro inbound
  - idempotência por `providerMessageId`
- Validação: `pnpm -w check-types` e `pnpm test:ci`.

## Resultado esperado (operacional)
- Inbound deixa de ser só “webhook → métricas” e vira:
  - conversa viva com estado e histórico confiável
  - base para CRM e SDR
  - decisões de roteamento que geram intenção (e o envio continua governado pelo Dispatch Engine)

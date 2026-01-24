## Diagnóstico (estado real)

* Hoje o sistema **normaliza webhooks** em `NormalizedWhatsAppEvent` e usa isso para reputação/sinais.

* Não existe ainda:

  * `Conversation` como Aggregate Root

  * `Message` como entidade persistida de domínio

  * pipeline Webhook → Conversation (find/create + append)

  * persistência Prisma para conversa/mensagem

* `tenantId` já existe no domínio via `Instance.companyId` ([instance.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/entities/instance.ts#L10-L21)), então dá para amarrar Conversation ao “tenant” sem inventar outra fonte.

## Objetivo do Step 15 (exatamente como você descreveu)

* Criar **Conversation Aggregate** (DDD puro) + **Message Entity** (evento persistido) + pipeline Webhook → Conversation.

* Sem CRM completo e sem IA: só fundação operacional.

## Decisões de modelagem (para não travar depois)

* `tenantId` = `Instance.companyId` (fonte já existente no domínio).

* `contactId` = identificador estável derivado de `remoteJid` (string normalizada), sem criar CRM/Contact agora.

* “Uma conversa ativa por (instanceId + contactId)” será garantida por:

  * comportamento/repositório no domínio +

  * constraint de persistência com `isActive` (permitindo múltiplas conversas fechadas sem partial unique).

## Implementação

### 1) Prisma models (persistência)

* Criar `packages/db/prisma/schema/conversation.prisma` com:

  * `Conversation`:

    * `id (uuid PK)`, `tenantId`, `channel`, `instanceId`, `contactId`, `status (OPEN|ASSIGNED|CLOSED)`, `isActive (bool)`, `assignedAgentId?`, `openedAt`, `lastMessageAt`, timestamps

    * índice: `@@index([tenantId, instanceId, contactId])`

    * unique: `@@unique([instanceId, contactId, isActive])` (só uma ativa)

  * `Message`:

    * `id (uuid PK)`, `conversationId (FK)`, `direction`, `type`, `sentBy`, `providerMessageId?`, `contentRef?`, `metadata Json?`, `occurredAt`

    * unique idempotência: `@@unique([conversationId, providerMessageId])` (quando existir)

* Rodar generate/migrate conforme padrão do repo.

### 2) Domain: Conversation + Message (behavior-rich)

* Adicionar em `apps/server/src/domain/entities`:

  * `Conversation` Aggregate Root com métodos:

    * `open(...)` (factory)

    * `appendInboundMessage(...)` / `appendOutboundMessage(...)`

    * `assignAgent(agentId)` / `close()`

    * atualizar `lastMessageAt` via método, não por set.

  * `Message` Entity (ou value-rich entity) com invariantes de direção/sentBy.

* Domain events (opcional agora, mas barato e útil):

  * `ConversationOpened`, `MessageReceived`.

### 3) Repositórios

* Definir interfaces em `apps/server/src/domain/repositories`:

  * `ConversationRepository`:

    * `findActiveByInstanceAndContact(instanceId, contactId)`

    * `create(conversation)` / `save(conversation)`

  * `MessageRepository`:

    * `append(message)`

    * `findByProviderMessageId(conversationId, providerMessageId)` para idempotência/update

* Implementar adapters Prisma em `apps/server/src/infra/repositories`.

### 4) Normalização mínima para conteúdo (sem vazar raw payload)

* Ajustar o transformer TurboZap para guardar **conteúdo textual quando disponível** em `event.metadata` (ex.: `{ text: "..." }` para mensagens text), mantendo “minimal e non-sensitive”.

  * Arquivo: [turbozap.webhook-handler.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/webhooks/handlers/turbozap.webhook-handler.ts)

### 5) Webhook → Conversation pipeline (Application)

* Criar use cases em `apps/server/src/application/use-cases`:

  * `FindOrCreateConversationUseCase`:

    * resolve `tenantId` via `InstanceRepository.findById(instanceId)` → `companyId`

    * aplica regra: conversa criada **apenas no primeiro inbound**.

  * `AppendMessageUseCase`:

    * cria `Message` (INBOUND/OUTBOUND) e persiste;

    * atualiza `Conversation.lastMessageAt`.

  * `IngestConversationEventUseCase`:

    * recebe `NormalizedWhatsAppEvent`

    * decide se é inbound/outbound relevante e chama os use cases

    * idempotência por `providerMessageId`.

### 6) Wiring no handler (sem tocar warmup)

* No [WhatsAppWebhookApplicationHandler](file:///d:/Projeto/WhatLead/apps/server/src/application/handlers/webhook/whatsapp-webhook.handler.ts):

  * orquestrar:

    1. `IngestConversationEventUseCase.execute(event)`
    2. `IngestReputationSignalUseCase.execute(event)` (como hoje)

* A reputação continua igual; Conversation Core só consome os mesmos eventos normalizados.

## Testes (critério de “feito”)

* `FindOrCreateConversationUseCase`:

  * cria conversa no primeiro inbound;

  * não cria no outbound;

  * reaproveita conversa ativa.

* `IngestConversationEventUseCase`:

  * `MESSAGE_RECEIVED` → Conversation + Message;

  * idempotência por `providerMessageId`.

* Adapters Prisma com mock do `@WhatLead/db` (mesmo padrão já usado no repo).

## Validação

* `pnpm -C packages/db db:generate`

* `pnpm -w check-types`

* `pnpm test:ci`

## Resultado esperado

* Pergunta “o que acontece quando um lead responde?” passa a ter resposta concreta:

  * webhook normalizado → conversa ativa (ou criada) → mensagem inbound persistida → eventos/timeline do domínio disponíveis para assignment/CRM/IA depois.


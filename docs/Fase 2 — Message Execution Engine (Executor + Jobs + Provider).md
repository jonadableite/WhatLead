## Objetivo (Fase 2)

Implementar o **Executor** que consome `MessageIntent` já decididos (status `APPROVED`) e **executa** o envio via provider, com rastreabilidade e idempotência.

- Gate decide (já existe)
- Executor executa (novo)
- Job evita duplicidade/conflito

## Estado atual do repositório (o que vamos reaproveitar)

- Provider já existe (WhatsMeow/TurboZap) com interface neutra e adapters:
  - `WhatsAppProvider` + factory/registro: [whatsapp-provider.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/providers/whatsapp-provider.ts), [whatsapp-provider-factory.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/providers/whatsapp-provider-factory.ts)
  - Implementação real TurboZap (WhatsMeow API): [turbozap.provider.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/providers/whatsapp/turbozap/turbozap.provider.ts), [turbozap.client.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/providers/whatsapp/turbozap/turbozap.client.ts)
  - Adapter de envio “mensagem” (TEXT/REACTION/AUDIO/IMAGE): [whatsapp-message-dispatch-adapter.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/dispatch/whatsapp-message-dispatch-adapter.ts)

## Checklist executivo (implementação)

### 1) Domínio

1. **VO `ExecutionStatus`**
   - `PENDING | PROCESSING | SENT | FAILED | RETRY`

2. **Entity `MessageExecutionJob`**
   - Campos: `id, intentId, instanceId, provider, status, attempts, lastError?, createdAt, executedAt?`
   - Invariantes:
     - `attempts` incrementa quando o job é “claimado” (`PROCESSING`)
     - `executedAt` só quando `SENT`

3. **Eventos de execução**
   - `MessageSent` e `MessageFailed` (contendo `jobId, intentId, instanceId, provider, occurredAt, error?`)
   - Publicados via `DomainEventBus`

### 2) Application

1. **CreateExecutionJobUseCase**
   - Entrada: `intentId` (e orgId), lê `MessageIntent`.
   - Se intent não estiver `APPROVED` ou não tiver `decidedByInstanceId` → não cria.
   - Cria job com **idempotência** (chave única `intentId`).

2. **ExecuteMessageIntentUseCase**
   - Entrada: `jobId`.
   - Carrega job + intent.
   - Converte `MessageIntent.payload` → comando técnico (`sendText/sendMedia/sendAudio/sendReaction`).
   - Chama `WhatsAppProviderPort`.
   - Persiste resultado:
     - Job `SENT` ou `FAILED/RETRY` (com `attempts`, `lastError`)
     - Intent vira `SENT` (e opcionalmente guarda `executedAt`).
   - Emite `MessageSent/MessageFailed`.
   - Regra: **nenhuma decisão** aqui (nada de cooldown, risk, etc.).

3. **RetryFailedExecutionUseCase**
   - Política simples e explícita: se `attempts < MAX_ATTEMPTS`, move `FAILED → RETRY → PENDING` (ou apenas marca `RETRY` com backoff calculado por `attempts`).
   - Sem heurística escondida.

### 3) Infra

1. **Prisma model `message_execution_job`**
   - Índices:
     - `@@unique([intentId])` (evita job duplicado)
     - `@@index([status, createdAt])` (worker eficiente)

2. **Repository Prisma/InMemory**
   - `createIfNotExists(intentId, ...)`
   - `listRunnable(limit)` (PENDING/RETRY)
   - `tryClaim(jobId)` (update status para PROCESSING se ainda PENDING)
   - `markSent/markFailed`

3. **Provider Interface (neutra)**
   - Criar `WhatsAppProviderPort` com:
     - `sendText(instanceId,to,text)`
     - `sendMedia(instanceId,to,url,mime,caption?)`
     - `sendAudio(instanceId,to,url)`
     - `sendReaction(instanceId,to,msgRef,emoji)`

4. **Provider concreto (WhatsMeow)**
   - Implementar `WhatsMeowProviderAdapter` em infra **sem regra**.
   - Estratégia recomendada para não duplicar código:
     - `WhatsMeowProviderAdapter` apenas **encapsula** o provider já existente (`TurboZapProvider`/`WhatsAppProvider`) e expõe o contrato `WhatsAppProviderPort`.
     - Mantém a possibilidade de plugar Evolution depois via outro adapter.

5. **Worker/Consumer (cron no server)**
   - Criar `MessageExecutorWorker` com ticks:
     1) buscar intents `APPROVED` e criar job (idempotente)
     2) buscar jobs `PENDING/RETRY`, claimar (optimistic) e executar
     3) aplicar retry (chamar RetryFailedExecutionUseCase)
   - Plug no bootstrap do server no mesmo padrão do cron atual: [instance-health.cron.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/handlers/cron/instance-health.cron.ts), start em [index.ts](file:///d:/Projeto/WhatLead/apps/server/src/index.ts#L738-L753)

## Ponto crítico (concorrência e anti-duplicação)

- **Job único por intent** via `unique(intentId)`.
- **Claim atômico por status** (update `PENDING → PROCESSING` com where `id + status`), garantindo que dois workers não enviam duas vezes.

## Verificação

- Testes unitários:
  - cria job idempotente
  - execução marca `SENT` e atualiza intent
  - falha marca `FAILED/RETRY` e incrementa attempts
  - claim impede execução concorrente
- `pnpm -F server check-types` + `pnpm test -- --run` + `pnpm -F web build`

Se aprovar, eu implemento exatamente esse checklist, reusando o provider TurboZap já existente como o “WhatsMeowProviderAdapter” (camada dumb), e adicionando o job/repo/worker para envio real com rastreabilidade.
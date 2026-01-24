## Contexto (estado atual)

* Já existe um Gate em produção: [DispatchGateUseCase](file:///d:/Projeto/WhatLead/apps/server/src/application/dispatch-gate/dispatch-gate.use-case.ts#L14-L150). Ele **não escolhe instância**: recebe `instanceId` e só decide ALLOW/BLOCK com health/policy/rate.

* O warmup hoje **envia** via `DispatchUseCase` (passa no gate) e ainda faz algumas ações direto no port. [warmup-orchestrator.use-case.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/warmup/warmup-orchestrator.use-case.ts#L13-L283)

## Objetivo (Fase 1 — Gate)

* Criar o motor central que decide **SE, QUANDO e POR QUAL instância** uma mensagem pode sair.

* Nenhuma mensagem “aprovada” sem passar no Gate (warmup incluso).

* Sem provider real nesta fase: o resultado é **decisão + eventos + persistência do intent**, não envio.

## 1) MessageIntent (Domínio)

* Criar agregado `MessageIntent` em `apps/server/src/domain/entities/message-intent.ts`.

* Campos (mínimo viável e tipado):

  * `id`, `organizationId`

  * `target`: `{ kind: 'PHONE' | 'GROUP'; value: string }`

  * `type`: `TEXT | AUDIO | MEDIA | REACTION`

  * `purpose`: `WARMUP | DISPATCH | SCHEDULE`

  * `payload`: união discriminada por `type` (ex.: `{ text }`, `{ audioUrl }`, `{ mediaUrl, mimeType, caption? }`, `{ emoji, messageRef? }`)

  * `status`: incluir `PENDING | APPROVED | QUEUED | BLOCKED | DROPPED | SENT` (SENT ficará reservado para Fase 2)

  * `decidedByInstanceId?`, `blockedReason?`, `queuedUntil?`

  * `createdAt`

* Invariantes (no domínio):

  * intent nasce `PENDING`

  * só pode virar `APPROVED` com `decidedByInstanceId`

  * `QUEUED` exige `queuedUntil`

  * `BLOCKED` exige `blockedReason` semântico

## 2) Eventos (Domínio)

* Criar `MessageIntentDomainEvent` em `apps/server/src/domain/events/message-intent-events.ts`:

  * `MessageApproved` (intentId, organizationId, instanceId, occurredAt)

  * `MessageQueued` (intentId, organizationId, queuedUntil, occurredAt, reason)

  * `MessageBlocked` (intentId, organizationId, reason, occurredAt)

* Publicar via o `DomainEventBus` já existente. [domain-event-bus.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/events/domain-event-bus.ts)

## 3) Repositório (Domínio + Infra)

* Criar `MessageIntentRepository` (domain/repositories) com:

  * `create(intent)`, `save(intent)`, `findById(id)`, `listPendingByOrg(orgId, limit)`

* Infra inicial (para não depender do provider):

  * `InMemoryMessageIntentRepository`

  * (Opcional já nesta fase) `PrismaMessageIntentRepository` + modelo prisma (se você quiser persistência imediata).

## 4) DispatchGateUseCase (novo: seleciona instância)

* Implementar um Gate novo (sem quebrar o atual) em `apps/server/src/application/message-dispatch/dispatch-message-intent-gate.use-case.ts`.

* Entrada: `MessageIntent` (ou `intentId` + orgId).

* Dependências:

  * `InstanceRepository` (listar instâncias da org)

  * `EvaluateInstanceHealthUseCase` (opcionalmente reavaliar candidatos)

  * `DispatchPolicy` (reusar regras já no domínio) [dispatch-policy.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/services/dispatch-policy.ts#L7-L96)

  * `DispatchRateSnapshotPort` (reusar limites por instância)

  * `PlanPolicy` (reusar limites de plano)

  * `MessageIntentRepository`

  * `DomainEventBus<MessageIntentDomainEvent>`

* Algoritmo de decisão (determinístico):

  1. Carregar intent e instâncias da org.
  2. Filtrar instâncias por compatibilidade óbvia (purpose + conexão básica).
  3. Para cada candidata, calcular `decision` reusando policy/limites atuais (mesma semântica do gate existente), mas **sem enviar**.
  4. Se existir ao menos uma candidata ALLOW: escolher a “melhor” (menor risco + melhor conexão + menor rate pressure) e marcar intent `APPROVED` com `decidedByInstanceId`.
  5. Se todas falham apenas por cooldown/overheat (recuperável): marcar `QUEUED` com `queuedUntil` (ex.: baseado em cooldown/interval mínimo) e emitir `MessageQueued`.
  6. Caso contrário: `BLOCKED` com motivo semântico e emitir `MessageBlocked`.

## 5) Warmup como cliente do Gate (sem envio)

* Refatorar `WarmupOrchestratorUseCase` para:

  * Gerar `MessageIntent` com `purpose=WARMUP` e tipos variados.

  * Chamar o Gate novo para decidir `APPROVED/BLOCKED/QUEUED`.

  * Remover envios via `DispatchUseCase` e remover ações diretas que representem “mensagem” (presence/read podem ficar fora do escopo do Gate, mas só se você confirmar que não contam como envio).

## 6) Integração mínima (sem provider)

* Criar um endpoint interno simples (ou job handler) para “solicitar decisão” por intent:

  * `POST /api/message-intents` (cria PENDING)

  * `POST /api/message-intents/:id/decide` (roda Gate e atualiza status)

* Sem executar mensagens nesta fase.

## 7) Verificação

* Testes unitários do Gate (casos: APPROVED, QUEUED por cooldown, BLOCKED por risco/policy/limite).

* `pnpm -F server check-types` + `pnpm -F web build`.

Se aprovar, eu implemento exatamente nesta ordem (Fase 1 completa), mantendo o Gate atual intacto e criando o Gate “seletor de instância” como novo coração do fluxo.

## Ajustes finos que recomendo (pequenos, mas importantes)

&#x20;

Nada estrutural. Apenas **dois refinamentos**.

### 🔧 Ajuste 1 — “Motivo semântico” padronizado

Sugiro que `blockedReason` e `reason` de `MessageQueued` usem **enum/VO**, não string livre:

Exemplo:

```
COOLDOWN_ACTIVE
RATE_LIMIT
PLAN_LIMIT
INSTANCE_UNHEALTHY
NO_ELIGIBLE_INSTANCE

```

Isso facilita:

* métricas
* UI
* alertas
* ML futuro (quando vier)

***

### 🔧 Ajuste 2 — Função de scoring isolada

Mesmo sem ML, recomendo extrair o “ranking” para algo como:

```
InstanceDispatchScoreService

```

Mesmo que hoje seja:

* menor risk
* melhor connection
* menor rate pressure

Isso evita enterrar lógica de priorização dentro do use case.

***

## 3. Ordem EXATA de execução (sem pular nada)

Aqui está o **checklist executivo** que você pode literalmente seguir:

### Fase 1 — Domínio

1. Criar `MessageIntent` (entity + invariantes)
2. Criar `message-intent-events.ts`
3. Criar `MessageIntentRepository` + InMemory impl

### Fase 2 — Application

1. Criar `DispatchMessageIntentGateUseCase`
2. Integrar `DispatchPolicy`, `PlanPolicy`, `RateSnapshot`
3. Implementar algoritmo de seleção

### Fase 3 — Refactor

1. Refatorar `WarmupOrchestratorUseCase` → gerar intents
2. Remover envio direto no warmup

### Fase 4 — Interface mínima

1. Endpoint `POST /message-intents`
2. Endpoint `POST /message-intents/:id/decide`

### Fase 5 — Qualidade

1. Testes unitários (APPROVED / QUEUED / BLOCKED)
2. check-types + build

***

## 4. Definition of Done (quando a Fase 1 termina)

Você pode considerar essa fase **100% concluída** quando:

* ❌ Nenhuma mensagem sai do sistema sem MessageIntent
* ❌ Warmup não envia nada diretamente
* ✅ Toda decisão passa por um único Gate
* ✅ Instância escolhida é sempre explícita
* ✅ Eventos descrevem decisões
* ✅ Provider ainda não existe e nada quebra

Nesse ponto, o WhatLead:

* já escala
* já é auditável
* já é seguro
* já aceita IA
* já aceita múltiplos WhatsApp


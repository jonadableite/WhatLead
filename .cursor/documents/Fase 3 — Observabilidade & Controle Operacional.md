## Resposta direta: o próximo passo REAL

Implementar **Fase 3 — Observabilidade & Controle Operacional** agora. O sistema já decide (Gate) e já executa (Executor), mas hoje:
- não existe `/metrics`
- o `DomainEventBus` só loga (não persiste eventos)
- não existe kill-switch manual (pausar instância/org/campanha)
- não existe timeline auditável ponta-a-ponta

## Base existente (o que vamos reaproveitar)

- Pipeline de “signals/metrics” já existe (mas focado em reputação):
  - `MetricIngestionPort` + adapter para signals: [metric-ingestion-port.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/ports/metric-ingestion-port.ts), [signal-metric-ingestion-adapter.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/signals/signal-metric-ingestion-adapter.ts)
  - Histórico/armazenamento: [prisma-reputation-signal-repository.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/signals/prisma-reputation-signal-repository.ts)
- Executor e Gate já emitem eventos, mas **não há persistência** (somente log): [logging-domain-event-bus.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/event-bus/logging-domain-event-bus.ts)
- Autorização por organização/membro existe (Better Auth): `Member.role` (`owner|admin|member`) em [auth.prisma](file:///d:/Projeto/WhatLead/packages/db/prisma/schema/auth.prisma#L105-L120)

## O que entra na Fase 3 (ordem correta)

### 1) Métricas de execução (obrigatório)

**Objetivo:** medir “o que está acontecendo” sem ML.

1. **Criar Query Use Cases (Application)** para métricas agregadas:
   - `GetExecutionMetricsUseCase` com filtros: `windowMinutes`, `organizationId?`, `instanceId?`
   - Métricas mínimas:
     - por instância: approved/h, sent/h, failed/h, retries/h, avg time-to-send, cooldowns acionados
     - por org: volume total, distribuição por instância, saturação
2. **Infra Prisma (sem libs novas)**
   - Implementar agregações via `prisma.messageIntent` + `prisma.messageExecutionJob` (groupBy/where por janela).
   - Expor em JSON primeiro (mais rápido e já operável).
3. **Rotas operacionais (Infra/Web)**
   - `GET /api/ops/metrics?window=60` (org atual)
   - `GET /api/ops/instances/:id/metrics?window=60`
   - Controle de acesso: apenas `owner/admin` do org.

> Observação: `/metrics` no formato Prometheus pode virar “Fase 3.1”. Hoje não há dependência de `prom-client` no repo, então a entrega mais segura é JSON + futuras integrações.

### 2) Kill-switch (crítico)

**Objetivo:** parar desastre em produção sem quebrar arquitetura.

1. **Domínio**
   - Introduzir entidade/VO de controle operacional:
     - `ExecutionControlScope = INSTANCE | ORGANIZATION | CAMPAIGN`
     - `ExecutionControlStatus = ACTIVE | PAUSED`
     - entidade `ExecutionControl` com `reason`, `pausedUntil?`.
2. **Application (ports + use cases)**
   - `ExecutionControlRepository` (port) + `ExecutionControlPolicy` (service) que responde:
     - `isExecutionAllowed({ orgId, instanceId, campaignId?, now })`
   - Use cases:
     - `PauseInstanceUseCase`, `ResumeInstanceUseCase`
     - `PauseOrganizationUseCase`, `ResumeOrganizationUseCase`
     - `PauseCampaignUseCase`, `ResumeCampaignUseCase` (mantém pronto mesmo sem campanha ativa)
3. **Integração correta com Gate e Executor**
   - **Gate respeita** kill-switch:
     - se org/instância pausada → decisão `BLOCKED` com reason novo `OPS_PAUSED`.
   - **Executor não decide**, mas deve **obedecer**:
     - antes de chamar provider, consulta `ExecutionControlPolicy`.
     - se pausado → não chama provider, marca job como falha operacional (“OPS_PAUSED”) e define retry (ver item abaixo).
4. **Backoff / Retry controlado (necessário para pause)**
   - Ajustar `MessageExecutionJob` para suportar `nextAttemptAt` (ou equivalente).
   - `listRunnable(now)` filtra por `nextAttemptAt <= now`.
   - Quando pausado: setar `nextAttemptAt = now + 60s` (ou `pausedUntil`).

### 3) Timeline explicável (auditoria)

**Objetivo:** para qualquer intent/mensagem: quem decidiu, por quê, quando executou, qual instância/provider, sucesso/erro.

1. **Persistência de eventos (Infra)**
   - Criar tabela `operational_event` (ou `message_audit_event`) com:
     - `id, aggregateType, aggregateId, organizationId?, eventType, payload(Json), occurredAt, createdAt`
   - Implementar `PersistingDomainEventBus` (ou decorator) que grava eventos relevantes:
     - `MessageApproved/Queued/Blocked` (Gate)
     - `MessageSent/Failed` (Executor)
2. **Query Use Case**
   - `GetMessageIntentTimelineUseCase(intentId, orgId)` retorna lista ordenada.
3. **Rotas**
   - `GET /api/ops/message-intents/:id/timeline`
   - Controle de acesso: `owner/admin`.

## Verificação (obrigatória)

- Testes:
  - métricas agregadas (fixtures) e filtros por janela
  - kill-switch bloqueia Gate e impede execução
  - timeline retorna eventos esperados
- Validações:
  - `pnpm -F server check-types`
  - `pnpm test -- --run`

Se aprovar, eu começo pela ordem acima (métricas JSON → kill-switch → audit timeline), mantendo Clean Architecture (Domain ← Application ← Infra) e sem antecipar UI/CRM/LLM.
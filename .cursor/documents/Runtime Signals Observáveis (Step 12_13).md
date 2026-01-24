## Diagnóstico (o que já existe)
- Já existe `ReputationSignal` (value object) e persistência Prisma via `ReputationSignal` model: [reputation-signal.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/value-objects/reputation-signal.ts) e [reputation.prisma](file:///d:/Projeto/WhatLead/packages/db/prisma/schema/reputation.prisma).
- Já existem sinais *de envio* e *falha* saindo do dispatch via `producedEvents` (NormalizedWhatsAppEvent) no adapter: [whatsapp-dispatch-adapter.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/heater/whatsapp-dispatch-adapter.ts).
- Falta elevar isso para um conceito ativo (severity/context/source), cobrir sinais de runtime (presence, QR, rate limit, conexão) e tornar a timeline auditável.

## Objetivo do Step 12
- Transformar efeitos reais do runtime (dispatch/provider) em **ReputationSignal** persistido, normalizado e explicável.
- Sem heurística nova: apenas fatos + contexto, e interpretação continua no domínio.

## 12.1 — Formalizar ReputationSignal (conceito ativo)
- Evoluir `ReputationSignal` para ter:
  - `type` (expandido)
  - `severity: "LOW" | "MEDIUM" | "HIGH"`
  - `source: "WEBHOOK" | "DISPATCH" | "PROVIDER"`
  - `context: Record<string, unknown>` (somente dados não sensíveis)
  - `occurredAt`, `instanceId`, campos opcionais atuais
- Ajustar `ReputationSignalType` para incluir apenas fatos observáveis, por exemplo:
  - `MESSAGE_SENT`, `MESSAGE_FAILED`, `MESSAGE_DELIVERED`, `MESSAGE_READ`, `MESSAGE_REPLIED`
  - `PRESENCE_SET`
  - `CONNECTION_DISCONNECTED`, `CONNECTION_CONNECTED`, `CONNECTION_ERROR`
  - `QRCODE_REGENERATED`
  - `RATE_LIMIT_HIT`
  - `SEND_LATENCY_OBSERVED` (medição, não “spike”)

## 12.1 (persistência) — Prisma schema
- Alterar model `ReputationSignal` em [reputation.prisma](file:///d:/Projeto/WhatLead/packages/db/prisma/schema/reputation.prisma) para adicionar:
  - `severity String`
  - `source String`
  - `context Json` (ou `Json?`)
- Manter índices existentes e adicionar, se necessário:
  - `@@index([instanceId, source, occurredAt])`

## 12.2 — Emitir sinais no lugar certo (sem inferência)
### A) DispatchPort (pós-send)
- Após cada `send` bem sucedido/falhado (já existe sinal via producedEvents):
  - Converter para `ReputationSignal` com `source="DISPATCH"`, `severity` fixo por tipo, e `context` (ex.: messageType, providerErrorCode).
- Para `SET_PRESENCE`, emitir `PRESENCE_SET` (hoje não gera evento algum).
- Para `MARK_AS_READ`, manter como `MESSAGE_READ` com `source="DISPATCH"`.

### B) Provider (fatos de conexão/QR/rate limit)
- No provider TurboZap:
  - Mapear eventos de QR regenerado e disconnect/reconnect (quando existir no payload/provider callbacks) para `ReputationSignal` com `source="PROVIDER"`.
  - Mapear rate limit (HTTP 429, códigos específicos) para `RATE_LIMIT_HIT` com `context` contendo o código e endpoint.

## 12.x — Ingestão única (Application)
- Introduzir um use case único e fino: `RecordReputationSignalUseCase`:
  - recebe `ReputationSignal`
  - persiste via `ReputationSignalRepository`
  - opcionalmente chama `EvaluateInstanceHealthUseCase(reason: "WEBHOOK" | "PRE_DISPATCH" | "CRON")` conforme a origem (regra: sempre que sinal entrar por runtime/webhook, reavaliar saúde).
- Ajustar `IngestReputationSignalUseCase` atual para virar “normalizador” de `NormalizedWhatsAppEvent → ReputationSignal` e delegar ao `RecordReputationSignalUseCase`.
- Mantém a regra “provider não decide nada”: provider só emite fatos; interpretação segue no domínio.

## 12.3 — Domínio consumindo sinais (sem refactor destrutivo)
- Não substituir tudo por `reputation.apply(signal)` de uma vez.
- Passo incremental:
  - Expandir `SignalBackedInstanceMetricRepository` para derivar snapshot também de `PRESENCE_SET`, `RATE_LIMIT_HIT`, `CONNECTION_*`, `SEND_LATENCY_OBSERVED`.
  - Manter `InstanceReputation.evaluateWindow(snapshot)` como o ponto de inferência.
  - Adicionar campos no `ReputationSignals` snapshot se necessário (ex.: `rateLimitHits`, `presenceSets`, `qrcodeRegenerations`).

## 12.4 — Janelas temporais (sem ML)
- Manter a janela atual (30min) e adicionar 5/15/60min apenas como **config de repositório**, sem alterar domínio.
- Se for necessário, expor “windowMs” via env para experimentar sem alterar regras.

## Step 13 — Observabilidade de domínio (auditável)
- Criar um query/read-model simples (Application):
  - `GetReputationTimelineUseCase(instanceId, since, until)` → retorna sinais (type, severity, source, occurredAt, context)
- Expor via endpoint interno (Fastify route) ou via log estruturado.
- Não usar isso para decisão; apenas auditoria/dataset.

## Testes
- Unit: mapping de runtime → `ReputationSignal` (inclui `PRESENCE_SET`, `RATE_LIMIT_HIT`).
- Repo Prisma: persistência de `context` e filtros por `source/occurredAt`.
- Regressão: timeline + razão do cooldown continua explicável.

## Validação
- `pnpm -C packages/db db:generate`
- `pnpm -w check-types`
- `pnpm test:ci`

## Resultado esperado
- Timeline de sinais por instância consistente e persistida.
- Sinais emitidos no lugar certo (dispatch/provider) sem heurística.
- Domínio continua soberano: só interpreta snapshot/janela e explica decisões.
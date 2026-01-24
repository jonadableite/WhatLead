## Contexto (o que já existe e o que falta)
- Já existe o cérebro do domínio via [EvaluateInstanceHealthUseCase](file:///d:/Projeto/WhatLead/apps/server/src/domain/use-cases/evaluate-instance-health.ts) (sem provider) e a separação `lifecycleStatus` vs `connectionStatus` na [Instance](file:///d:/Projeto/WhatLead/apps/server/src/domain/entities/instance.ts).
- Já existe a normalização de webhooks (contratos) em [webhook-event-handler.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/event-handlers/webhook-event-handler.ts) e o transformer TurboZap em [turbozap.webhook-handler.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/webhooks/handlers/turbozap.webhook-handler.ts).
- O endpoint de webhook já aceita `eventHandler`, mas ainda não está “plugado” no bootstrap do servidor: [whatsapp-webhook.routes.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/webhooks/whatsapp-webhook.routes.ts).

## Objetivo (sem criar domínio)
- Criar Application Services/Handlers que recebem gatilhos reais, traduzem para o contrato do use case e reagem às `actions` retornadas (sem regra de negócio nova).

## 1) Criar Handlers na Application Layer (um por gatilho)
- Criar a estrutura:
  - `apps/server/src/application/handlers/webhook/whatsapp-webhook.handler.ts`
  - `apps/server/src/application/handlers/cron/instance-health.cron.ts`
  - `apps/server/src/application/handlers/dispatch/pre-dispatch.guard.ts`
  - `apps/server/src/application/handlers/campaign/post-campaign.handler.ts`

### Webhook Handler
- Implementar `WhatsAppWebhookApplicationHandler implements WebhookEventHandler`.
- Responsabilidades:
  - Receber `NormalizedWhatsAppEvent`.
  - Chamar um **port** de ingestão de métricas (`MetricIngestionPort.record(event)`), sem regra.
  - Chamar `EvaluateInstanceHealthUseCase.execute({ instanceId, reason: "WEBHOOK", now: event.occurredAt })`.
  - Reagir às `actions` apenas com *efeitos técnicos* (ex.: log/telemetria); nenhuma decisão.

### Cron Job Handler
- Implementar `InstanceHealthCronJob.run()`.
- Para listar instâncias “ativas” sem mudar domínio, criar um port de consulta na application layer (ex.: `ActiveInstanceIdsProvider` ou `InstanceQueryRepository`) usado apenas pelo cron.
- Para cada `instanceId` retornado: executar `EvaluateInstanceHealthUseCase` com `reason: "CRON"`.

### Pre-Dispatch Guard
- Implementar `PreDispatchGuard.ensureCanDispatch(instanceId)`.
- Executar `EvaluateInstanceHealthUseCase` com `reason: "PRE_DISPATCH"`.
- Se vier `BLOCK_DISPATCH`, lançar `DispatchBlockedError` (erro técnico de orquestração baseado no resultado do cérebro, sem lógica duplicada).

### Post-Campaign Handler
- Implementar `PostCampaignHandler.handle(instanceId)`.
- Executar `EvaluateInstanceHealthUseCase` com `reason: "POST_CAMPAIGN"`.

## 2) Ports (contratos) na Application Layer (sem domínio)
- Criar um port para ingestão de métricas a partir de eventos normalizados:
  - `MetricIngestionPort.record(event: NormalizedWhatsAppEvent): Promise<void>`
- Criar um port para enumerar instâncias candidatas ao cron:
  - `ActiveInstanceIdsProvider.list(): Promise<string[]>`

## 3) Adapters mínimos (Infra) para permitir operação real (sem provider)
- Implementar adaptadores simples (primeiro passo operacional):
  - `LoggingDomainEventBus` (adapter do `DomainEventBus` do domínio) que apenas loga eventos ou delega para uma lista de subscribers na application layer.
  - `InMemoryMetricIngestion` + `InMemoryInstanceMetricRepository` (agregação mínima de sinais) para que o `EvaluateInstanceHealthUseCase` funcione end-to-end, sem banco ainda.
  - `InMemoryInstanceRepository` (ou `ConfigBackedInstanceRepository`/`ActiveInstanceIdsProvider`) para viabilizar cron e avaliação fora de testes.

> Observação: quando o banco/modelos de Instance e métricas existirem, esses adapters são substituídos por Prisma adapters sem tocar no domínio.

## 4) Wiring no bootstrap (Server)
- No [index.ts](file:///d:/Projeto/WhatLead/apps/server/src/index.ts), registrar as rotas de webhook chamando `registerWebhookRoutes(fastify, { eventHandler, webhookSecret? })`.
- Instanciar os handlers e adapters (ports) e passar o `WhatsAppWebhookApplicationHandler` como `eventHandler`.
- (Opcional) adicionar envs para segredo do webhook e lista de instanceIds do cron.

## 5) Testes (Vitest) focados em orquestração
- Adicionar specs para cada handler:
  - Webhook: garante que `record(event)` é chamado e que `EvaluateInstanceHealthUseCase` é invocado com `reason: WEBHOOK`.
  - Cron: garante que itera `instanceIds` e chama use case com `reason: CRON`.
  - PreDispatchGuard: garante que lança `DispatchBlockedError` quando `actions` contém `BLOCK_DISPATCH`.
  - PostCampaign: garante chamada com `reason: POST_CAMPAIGN`.
- Testes de wiring (unit) para garantir que `registerWebhookRoutes` recebe o handler correto.

## 6) Validação
- Rodar `pnpm -w check-types` e `pnpm test:ci`.
- Subir `pnpm dev:server` e validar webhook `POST /webhooks/turbozap` processando eventos (ao menos log + chamada de avaliação).
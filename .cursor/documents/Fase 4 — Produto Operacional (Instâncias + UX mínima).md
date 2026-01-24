## Diagnóstico honesto (antes de codar)

- Você já tem **/instances (CRUD mínimo + health)** no backend e **telas básicas** no web.
- Você já tem **/api/ops/metrics + pause/resume + timeline** (Fase 3) no backend.
- Gap crítico para onboarding real:
  - `POST /api/instances/:id/connect` hoje **só marca CONNECTING** (não chama provider), então **não existe QR Code** nem fluxo de “Conectar WhatsApp” operável. Veja [request-instance-connection.use-case.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/instances/request-instance-connection.use-case.ts#L20-L36).
  - O provider **tem** `connect()` e `getQRCode()` (TurboZap) mas não está exposto/plugado: [turbozap.provider.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/providers/whatsapp/turbozap/turbozap.provider.ts#L91-L148).

## Regra de ouro aplicada

- Frontend **não decide** cooldown/risco/limites.
- Frontend **só renderiza** status, alertas e decisões vindas do backend.
- Sempre que executar ação crítica (pause/resume/connect), **invalidar SWR** (nunca “forjar” estado local).

## Entrega da Fase 4 (ordem correta)

### 0) Backend mínimo para tornar o que existe “operável”

Sem criar regra nova: apenas **orquestração** e **queries** para UX.

1. **Conexão real com QR Code**
   - Ajustar o fluxo de conexão para chamar o provider (TurboZap) e retornar QR/status.
   - Adicionar endpoints read-only:
     - `GET /api/instances/:id/connection-status` (status + metadados)
     - `GET /api/instances/:id/qrcode` (string do QR)
   - Manter a regra: provider é “dumb”; use case orquestra e persiste `connectionStatus`.

2. **Listagem de MessageIntents (para Timeline funcionar na UI)**
   - Criar `GET /api/message-intents` com filtros (query simples):
     - `status?`, `purpose?`, `instanceId?`, `limit?`
   - Retornar ViewModel mínimo (id, target, purpose, status, decidedByInstanceId, createdAt).

### 1) Camada API no frontend (sem gambiarras)

Reusar o padrão existente `apiFetch` + `useApiSWR`.

1. Criar novos clients:
   - `apps/web/src/lib/ops/ops-api.ts` (pause/resume + metrics + timeline)
   - `apps/web/src/lib/message-intents/message-intents-api.ts` (list)
   - (se necessário) `apps/web/src/lib/instances/instance-connection-api.ts` (status/qrcode)

2. Criar DTOs estritos (sem `any`):
   - `apps/web/src/lib/ops/ops-types.ts` (ExecutionMetricsSnapshot, TimelineResponse)
   - `apps/web/src/lib/message-intents/message-intents-types.ts`

### 2) UX Flow — Telas (foco cirúrgico)

#### Sprint 1 — /instances e /instances/new (onboarding real)

1. **/instances (CORE)**
   - Melhorar `InstancesDashboard` para:
     - Status em pt-BR (rótulos e badges): `connectionStatus`, `lifecycleStatus`, `riskLevel`, `purpose`.
     - Ações por instância:
       - “Ver detalhes”
       - “Pausar / Retomar” (chama `/api/ops/instances/:id/pause|resume`)
       - “Ver métricas” (modal/side panel consumindo `/api/ops/instances/:id/metrics`)
     - Avisos orientados a risco (pt-BR) quando `riskLevel=HIGH` ou `lifecycleStatus=COOLDOWN/BANNED`.

2. **/instances/new (step-by-step)**
   - Refatorar `new-instance-page-client.tsx` para 3 passos:
     - Passo 1: Configurar (nome + purpose com descrições em pt-BR + engine)
     - Passo 2: Criar (POST /api/instances)
     - Passo 3: Conectar WhatsApp:
       - botão “Gerar QR Code” (POST connect)
       - polling de status (SWR com `refreshInterval`)
       - exibir QR code quando disponível
       - erros sempre em pt-BR

#### Sprint 2 — /instances/:id (painel operacional)

- Evoluir [instance-details-page-client.tsx](file:///d:/Projeto/WhatLead/apps/web/src/app/(dashboard)/instances/%5Bid%5D/instance-details-page-client.tsx) para tabs:
  - **Visão geral**: status + propósito + risco + alerta principal
  - **Métricas**: última hora / 24h (2 queries `/api/ops/instances/:id/metrics?window=60` e `?window=1440`)
  - **Auditoria**: lista de message intents recentes (GET /api/message-intents?instanceId=...) e, ao clicar, carrega timeline `/api/ops/message-intents/:id/timeline`
  - **Configurações**: pause/resume com confirmação (copy pt-BR)

#### Sprint 3 — /message-intents (visão global mínima)

- Criar rota nova no app:
  - listagem com filtros e link para timeline.
- Sem automações, sem CRM.

### 3) Polimento “orientado a risco” (sem inventar regra)

- Criar mapeadores de UI (pt-BR) para enums:
  - connectionStatus/lifecycleStatus/purpose/risk
- Padronizar mensagens:
  - cooldown: “Instância em cooldown. Aguarde antes de retomar envios.”
  - bloqueios: “Operação pausada por controle operacional.”
- Remover termos em inglês já existentes no front (ex.: títulos “Warmup/Dispatch/Mixed”).

## Verificação

- Tests:
  - hooks/api clients com mocks (onde fizer sentido)
  - smoke tests das páginas principais
- Build:
  - `pnpm -F web build`
  - `pnpm -F server check-types` (se houver endpoints novos)

Se aprovar, eu começo pelo **Sprint 1** (instâncias + onboarding) e, em paralelo, faço o **Backend mínimo** do QR/status + listagem de intents para não travar a UX.
## Objetivo
- Implementar o Use Case central de saúde da instância (sem provider), que orquestra sinais → reputação → transições de estado → eventos → persistência.

## Estado Atual (e gap)
- Já existe um caso muito próximo: [update-instance-health.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/use-cases/update-instance-health.ts) que carrega Instance, avalia reputação, decide cooldown/risco, retorna eventos.
- Instance já separa status técnico e de domínio via `lifecycleStatus` e `connectionStatus`: [instance.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/entities/instance.ts).
- Falta alinhar com o contrato solicitado: `reason`, `actions`, `riskLevel` em UPPERCASE, e `DomainEventBus` como dependência explícita.

## Modelagem (DDD)
- **Request VO**: criar `InstanceHealthEvaluationReason` (VO) com `WEBHOOK | CRON | PRE_DISPATCH | POST_CAMPAIGN`.
- **Response**: expor `lifecycleStatus + connectionStatus` (evita ambiguidade) e adicionar `actions` semânticas.
- **Actions** (VO/Union): `ENTER_COOLDOWN | ALLOW_DISPATCH | BLOCK_DISPATCH | ALERT`.
- **Eventos de Domínio**: manter e evoluir [instance-events.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/events/instance-events.ts) para incluir `reason` (metadata de decisão), preservando linguagem ubíqua.

## Implementação (sem provider)
1) **Criar contrato DomainEventBus** no domínio (ex.: `apps/server/src/domain/events/domain-event-bus.ts`)
   - `publish(event)` e `publishMany(events)`.
2) **Renomear/Ajustar Use Case**
   - Criar `EvaluateInstanceHealthUseCase` reaproveitando a lógica do `UpdateInstanceHealthUseCase`, mas:
     - aceitar `reason` no request.
     - calcular `actions` e retorná-las.
     - publicar eventos via `eventBus` (em vez de apenas retornar lista).
     - padronizar `riskLevel` como `LOW|MEDIUM|HIGH` (mapeando do `getRiskLevel()` atual).
3) **Garantir regras dentro do domínio**
   - Adicionar um método na entidade `Instance` para produzir `actions` (ex.: `allowedActions(now)`), usando `canDispatch/canWarmUp/requiresCooldown/isAtRisk`.
   - Manter cálculo de reputação no `IInstanceReputationEvaluator` (Domain Service) como Strategy plugável para ML.
4) **Persistência**
   - Continuar usando interfaces de repositório (InstanceRepository/InstanceReputationRepository/InstanceMetricRepository) sem infra.

## Testes (Vitest)
- Criar/atualizar specs para:
  - `EvaluateInstanceHealthUseCase`: cenários `WEBHOOK` (cooldown), `PRE_DISPATCH` (block/allow), `CRON` (at-risk), `POST_CAMPAIGN` (recover).
  - `Instance.allowedActions`: garante que não há `ALLOW_DISPATCH` em `COOLDOWN/BANNED`, e que `BLOCK_DISPATCH` aparece quando não pode.
  - `DomainEventBus`: mock simples garantindo que `publishMany` recebe os eventos corretos.

## Migração e compatibilidade
- Manter `UpdateInstanceHealthUseCase` como wrapper/deprecated (ou remover se não for usado) depois que o novo Use Case estiver consumido.
- Atualizar imports onde necessário para não quebrar build.

## Validação
- Rodar `pnpm -w check-types` e `pnpm test:ci` para garantir zero regressões.
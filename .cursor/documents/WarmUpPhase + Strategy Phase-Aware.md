## Objetivo
- Formalizar o protocolo de aquecimento por fases (WarmUpPhase) e derivar a fase a partir da reputação.
- Tornar `WarmUpStrategy` consciente da fase para evoluir ações de forma progressiva e observável.

## Decisão de arquitetura (para não “vazar” regra)
- **WarmUpPhase pertence ao domínio**, porque é uma interpretação semântica do estado de reputação (ubiquitous language, ML-ready e determinística).
- A fase **não é persistida** agora; ela é **derivada** (pure function) via `InstanceReputation.currentWarmUpPhase(now)`.
- A strategy e o heater apenas **consomem a fase** — sem reimplementar thresholds/riscos.

## Passo 1 — Criar o enum WarmUpPhase (Domínio)
- Criar `apps/server/src/domain/value-objects/warmup-phase.ts`:
  - `export const WARMUP_PHASES = ["NEWBORN","OBSERVER","INTERACTING","SOCIAL","READY"] as const`
  - `export type WarmUpPhase = ...`

## Passo 2 — Derivar fase na InstanceReputation (Domínio)
- Adicionar método em [instance-reputation.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/entities/instance-reputation.ts):
  - `currentWarmUpPhase(now: Date = new Date()): WarmUpPhase`
- Regra inicial (determinística e simples, ajustável):
  - Se `temperatureLevel === "COOLDOWN"` ou `isAtRisk()` → regredir para `OBSERVER` (ou `NEWBORN` se cooldownCount alto)
  - Se `score < 50` → `OBSERVER`
  - Se `score < 65` → `INTERACTING`
  - Se `score < 80` → `SOCIAL`
  - Caso contrário → `READY`
- Sem usar provider e sem depender de idade (porque hoje não temos `createdAt` na reputação). Se quiser idade depois, adicionamos apenas quando houver fonte confiável.

## Passo 3 — Atualizar contrato de WarmUpStrategy (Application)
- Alterar [warmup-strategy.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/heater/warmup-strategy.ts):
  - `plan({ instance, phase, now })`
  - `phase: WarmUpPhase` importado do domínio.

## Passo 4 — Passar fase pelo HeaterUseCase (Application)
- Em [heater.use-case.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/heater/heater.use-case.ts):
  - `const phase = instance.reputation.currentWarmUpPhase(now)`
  - `const plan = await warmUpStrategy.plan({ instance, phase, now })`

## Passo 5 — Tornar HumanLikeWarmUpStrategy phase-aware (Application)
- Atualizar [human-like.strategy.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/heater/strategies/human-like.strategy.ts) para:
  - `NEWBORN`: somente `SET_PRESENCE`
  - `OBSERVER`: `SET_PRESENCE` e, se houver `messageId`, `MARK_AS_READ`/`SEND_REACTION`
  - `INTERACTING`: permitir `SEND_TEXT` curto
  - `SOCIAL`: permitir mais de um tipo de ação (ainda mantendo 1 ação por ciclo como guardrail inicial)
  - `READY`: ainda não faz “DISPATCH”; apenas habilita ações mais ricas de warmup

## Passo 6 — Testes (Vitest)
- Testar `InstanceReputation.currentWarmUpPhase()` com cenários de score/alerts/cooldown.
- Testar `HeaterUseCase` garantindo que a strategy recebe `phase` corretamente.
- Testar `HumanLikeWarmUpStrategy` verificando que cada fase produz apenas ações permitidas.

## Passo 7 — Validação
- Rodar `pnpm -w check-types` e `pnpm test:ci`.

## Resultado
- Aquecimento deixa de ser “cego” e passa a ser **protocolo por fases**.
- Evolução/regressão acontece automaticamente via reputação.
- Strategy fica plugável e previsível, e ML continua reservado para o evaluator no tempo certo.
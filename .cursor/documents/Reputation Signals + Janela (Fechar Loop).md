## Objetivo (próximo passo obrigatório)
- Fechar o loop comportamento → sinais observáveis → reputação → fase.
- Remover dependência de “BLOCK/REPORT explícito” e passar a **inferir degradação** via métricas por janela (delivery/read/latência/conexão).

## Estado atual (onde estamos)
- Já existe um formato normalizado e provider-agnóstico de eventos observáveis: [webhook-event-handler.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/event-handlers/webhook-event-handler.ts).
- A avaliação hoje consome `ReputationSignals` agregados via `InstanceMetricRepository.getRecentSignals()`: [instance-metric-repository.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/repositories/instance-metric-repository.ts).
- O algoritmo de avaliação está em `InstanceReputationEvaluator`: [instance-reputation-evaluator.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/services/instance-reputation-evaluator.ts) (regra determinística, ML-ready).

## Passo 1 — Definir o modelo de Signal observável (Domínio)
- Criar `apps/server/src/domain/value-objects/reputation-signal.ts`:
  - Tipos só de fatos observáveis: `MESSAGE_SENT | MESSAGE_DELIVERED | MESSAGE_READ | MESSAGE_REPLIED | MESSAGE_FAILED | CONNECTION_CONNECTED | CONNECTION_DISCONNECTED | CONNECTION_ERROR`.
  - Estrutura mínima: `{ type, instanceId, occurredAt, messageId?, latencyMs?, isGroup? }`.

## Passo 2 — Translator NormalizedWhatsAppEvent → ReputationSignal (Application)
- Criar `apps/server/src/application/signals/whatsapp-event-to-reputation-signal.ts`:
  - Mapeamento direto (sem regra):
    - `MESSAGE_SENT` → `MESSAGE_SENT`
    - `MESSAGE_DELIVERED` → `MESSAGE_DELIVERED`
    - `MESSAGE_READ` → `MESSAGE_READ`
    - `MESSAGE_RECEIVED` e `GROUP_MESSAGE_RECEIVED` → `MESSAGE_REPLIED` (entrada humana observável)
    - `MESSAGE_FAILED` → `MESSAGE_FAILED`
    - `CONNECTION_*` → `CONNECTION_*`
  - **Não** gerar `BLOCK`/`REPORT` aqui.

## Passo 3 — Signal Repository + agregação por janela (Domínio via contrato)
- Criar contrato `ReputationSignalRepository` no domínio (ou application port, mantendo domínio puro):
  - `append(signal)`
  - `getWindow(instanceId, window: { since: Date; until: Date }): Promise<ReputationSignal[]>`
- Implementação inicial (infra): usar o store atual em memória (hoje armazena `NormalizedWhatsAppEvent`) como backend, ou criar um store novo de `ReputationSignal`.

## Passo 4 — Criar o Use Case de entrada: IngestReputationSignalUseCase (Application)
- Criar `apps/server/src/application/use-cases/ingest-reputation-signal.use-case.ts`.
- Responsabilidade:
  - Receber `NormalizedWhatsAppEvent`.
  - Traduzir → `ReputationSignal`.
  - Persistir no `ReputationSignalRepository`.
  - (Opcional e recomendado) disparar `EvaluateInstanceHealthUseCase.execute({ instanceId, reason: "WEBHOOK", now })` para atualizar reputação/fase rapidamente.
- Atualizar o handler de webhook para chamar **esse use case** (em vez de gravar métrica direto + chamar health em dois lugares).

## Passo 5 — Avaliação por janela dentro da InstanceReputation (sem ML)
- Adicionar em `InstanceReputation` um método determinístico:
  - `evaluateWindow(windowStats): { inferredSignals, alerts, scoreDelta, cooldown? }`.
- `windowStats` não precisa ser lista de eventos; pode ser snapshot agregado (ex.: `sent, delivered, read, replied, failures, disconnects, avgLatencyMs`).
- Inferências iniciais (determinísticas):
  - `DELIVERY_DROP`: sent >= N e deliveredRate < X%
  - `SEND_DELAY_SPIKE`: avgLatencyMs > Y ou p95LatencyMs > Y
  - desconexões recorrentes → penalidade média
- O evaluator atual pode ser adaptado para **delegar** nessas funções (mantém ML-ready: outro evaluator pode substituir, mas o domínio já sabe interpretar “degradação”).

## Passo 6 — Repositório de métricas passa a ser “janela” (Infra)
- Evoluir `InstanceMetricRepository` para aceitar janela/since-last-evaluation:
  - opção A: `getSignals(instanceId, { since, until })`
  - opção B (compatível): manter `getRecentSignals()` e internamente usar `reputation.lastEvaluatedAt` (passado pelo use case) para calcular o since.
- Implementação inicial por in-memory: computar `windowStats` a partir dos `ReputationSignal` armazenados.

## Passo 7 — Testes de regressão (o que prova que o loop fechou)
- Caso 1: INTERACTING → janela com deliveryRate muito baixa → score cai → `currentWarmUpPhase()` regrede.
- Caso 2: latência cresce + desconexões → alerts → cooldown.
- Caso 3: replies/read/reactions sobem → score sobe → fase evolui.
- Tudo isso sem nenhum evento “BLOCK” explícito.

## Validação
- Rodar `pnpm -w check-types` e `pnpm test:ci`.

## Resultado esperado
- O aquecimento deixa de ser “simulação”: qualquer degradação real (entrega/latência/conexão/interação) gera penalidade por inferência.
- A reputação e a fase passam a reagir ao mundo real sem acoplar provider nem mover regra para heater/strategy.
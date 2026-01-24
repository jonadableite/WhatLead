## Diagnóstico (estado real)

* Já existe um **motor de envio** (`DispatchUseCase`) que: faz `PRE_DISPATCH`, aplica `DispatchPolicy` e faz rate/budget via timeline (`checkBudget`).

* Existe um **guard paralelo** no heater (`PreDispatchGuard` + `GuardedDispatchPort`) que também barra dispatch, mas com critérios diferentes.

* Warmup tem um **budget próprio** (`WarmupLimiter`) com regra levemente diferente (conta MESSAGE\_SENT + REACTION\_SENT).

* Resultado: ainda não há **uma única porta de saída semântica** que decida “pode virar mensagem agora?” para qualquer origem (operator/IA/followup/campaign/warmup).

## Objetivo do Step 9 (escopo fechado)

* Criar um **DispatchGateUseCase (Application)** que toma um **DispatchIntent (envelope único)** e retorna uma **decisão única**:

  * `allowed | blocked | delayedUntil` com `reason`

* Unificar (sem bypass):

  * saúde (`EvaluateInstanceHealthUseCase` PRE\_DISPATCH)

  * política de conteúdo/temperatura (`DispatchPolicy`)

  * rate limiting semântico (janela minuto/hora + repetição)

  * regras de follow-up baseado em SLA (ex.: só se `BREACHED`)

## Entregáveis

### 1) Application: DispatchIntent (envelope único)

* Criar `application/dispatch-gate/dispatch-intent.ts`:

  * `instanceId`

  * `conversationId?`

  * `type: REPLY | FOLLOW_UP | CAMPAIGN | WARMUP`

  * `payload: MessageDraft` (reutilizar o shape de `DispatchPayload` quando possível)

  * `reason: OPERATOR | SLA | CAMPAIGN | SYSTEM | AGENT`

  * `now?: Date`

### 2) Application: GateDecision (resultado do gate)

* Criar `application/dispatch-gate/dispatch-gate-decision.ts`:

  * `allowed: boolean`

  * `reason?: BLOCK_REASON`

  * `delayedUntil?: Date`

  * (opcional) `details` para auditoria (contagens, thresholds aplicados)

* Manter **Domain** **`DispatchDecision`** como decisão de política (max/hora, minInterval, allowedTypes). O GateDecision é a decisão final “agora”.

### 3) Application: DispatchGateUseCase

* Criar `application/dispatch-gate/dispatch-gate.use-case.ts`:

  * Dependências (injeção via ctor):

    * `InstanceRepository`

    * `EvaluateInstanceHealthUseCase`

    * `DispatchPolicy`

    * `GetReputationTimelineUseCase` (ou um port `DispatchRateSnapshotPort`)

    * `ConversationRepository` (para checar SLA quando intent for FOLLOW\_UP)

    * `SLAEvaluator` (Domain Service)

  * Ordem de avaliação (fixa):

    1. carregar instance (se não existe → block)
    2. `EvaluateInstanceHealthUseCase(PRE_DISPATCH)` (se não ALLOW\_DISPATCH → block)
    3. `DispatchPolicy.evaluate(...)` (se bloqueado → block com reason)
    4. **Rate semântico**:

       * calcular snapshot (lastMinute/lastHour + último sendAt)

       * se excedeu → `delayedUntil` (preferível) ou `blocked` (quando fizer sentido)

       * detectar repetição básica (mesmo `to` + mesmo `text` num intervalo curto) → block/delay
    5. **Follow-up guardado por SLA**:

       * se intent `FOLLOW_UP` e conversa não está `BREACHED` → block

  * Saída: `DispatchGateDecision`.

### 4) Port de snapshot (sem Redis agora)

* Introduzir `application/dispatch-gate/dispatch-rate-snapshot-port.ts`:

  * `getSnapshot({ instanceId, now }): { sentLastMinute, sentLastHour, lastMessageAt?, lastSignature? }`

* Implementação inicial **infra usando timeline** (sem estado externo):

  * `infra/dispatch-gate/timeline-dispatch-rate-snapshot-adapter.ts` (deriva contagens a partir de sinais `MESSAGE_SENT`/`REACTION_SENT` source DISPATCH)

### 5) Integração: tornar o Gate obrigatório

* Refatorar `DispatchUseCase`:

  * remover decisão própria de budget/interval (ou delegar totalmente ao Gate)

  * fluxo: `gate.execute(intent)` → se allowed → enviar → (continua emitindo producedEvents)

* Refatorar `PreDispatchGuard` / `GuardedDispatchPort`:

  * trocar o critério do guard para usar o **mesmo gate** (com um intent type `WARMUP`/`SYSTEM` conforme ação)

* Refatorar `WarmupLimiter`:

  * substituir por consulta ao GateSnapshot (mesma regra de contagem) ou remover gradualmente

### 6) Ajuste de nomenclatura (preparação do Step 12 corrigido)

* Manter a distinção conceitual:

  * **Agent = IA** (gera intents)

  * **Operator = humano** (gera intents)

* No Step 9, isso entra apenas como enum `reason`/`type` do intent (sem modelar Operator ainda).

## Testes (critério de pronto)

* `DispatchGateUseCase`:

  * bloqueia quando health não permite

  * retorna `delayedUntil` quando minInterval não respeitado

  * bloqueia follow-up quando SLA não está breached

* `DispatchUseCase` passa a respeitar GateDecision (não envia se blocked/delayed)

* Validação: `pnpm -w check-types` e `pnpm test:ci`.

## Resultado após o Step 9

* Uma única porta de saída semântica para qualquer fonte (Reply/FollowUp/Campaign/Warmup/Operator/Agent).

* Scheduler (Step 10) passa a ser trivial e seguro: ele só gera intent, e o Gate decide.

* Labels auditáveis (allowed/blocked/delayed) já ficam prontas para ML (bem depois).


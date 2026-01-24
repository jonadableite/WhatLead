## Estado atual (onde parou)
- Já existem:
  - `DispatchIntent`, `DispatchGateDecision`, `DispatchGateUseCase` (com health→SLA(FOLLOW_UP)→policy→rate)
  - `DispatchRateSnapshotPort` + `TimelineDispatchRateSnapshotAdapter`
- Ainda faltam (pendências do plano):
  - Integrar `DispatchUseCase` e `PreDispatchGuard/GuardedDispatchPort` ao Gate
  - Unificar o budget do warmup (`WarmupLimiter`) com o snapshot do Gate
  - Adicionar testes do Gate + integração e validar `check-types/test:ci`

## Próximas mudanças (execução)

### 1) Integrar DispatchUseCase ao DispatchGateUseCase
- Injetar `DispatchGateUseCase` no `DispatchUseCase`.
- Trocar o fluxo:
  1. construir `DispatchIntent` a partir de `DispatchRequest`
  2. `gate.execute(intent)`
  3. se `allowed=false`:
     - retornar `BLOCKED` (e, se existir `delayedUntil`, mapear para reason `RATE_LIMIT` com observação)
  4. se `allowed=true`: enviar via `MessageDispatchPort` como hoje.
- Remover `checkBudget` e remover a duplicação de `EvaluateInstanceHealthUseCase`/`DispatchPolicy` dentro do `DispatchUseCase` (essas decisões passam a ser responsabilidade do Gate).

### 2) Integrar PreDispatchGuard/GuardedDispatchPort ao Gate
- Substituir `PreDispatchGuard.ensureCanDispatch` para chamar `DispatchGateUseCase` (com intent `WARMUP`/`SYSTEM`) quando a action for `SEND_TEXT`/`SEND_REACTION`.
- Manter que presence/read não precisam do gate.

### 3) Unificar WarmupLimiter com o snapshot do Gate
- Trocar `WarmupLimiter` para depender de `DispatchRateSnapshotPort`.
- `getBudget` passa a usar `snapshot.sentLastHour` (message-like já unificado) para calcular remaining.

### 4) Wire-up no index.ts
- Instanciar:
  - `TimelineDispatchRateSnapshotAdapter` (usa `GetReputationTimelineUseCase`)
  - `SLAEvaluator`
  - `DispatchGateUseCase` (repos + evaluator + snapshot)
- Injetar Gate em:
  - `DispatchUseCase`
  - `PreDispatchGuard`
  - `WarmupLimiter` (indiretamente via WarmupOrchestrator)

### 5) Testes + validação
- Novos testes:
  - `DispatchGateUseCase`: bloqueia FOLLOW_UP sem SLA breached; retorna delayedUntil quando minInterval não respeitado
  - `DispatchUseCase`: não envia quando Gate bloqueia/delay
  - `WarmupLimiter`: usa sentLastHour do snapshot
- Rodar `pnpm -w check-types` e `pnpm test:ci`

## Resultado esperado
- Uma única porta de saída semântica (Gate) governando qualquer origem.
- `DispatchUseCase` vira executor (send + emitted events), sem regras duplicadas.
- Warmup e heater deixam de ter critérios paralelos de gate/budget.
## Estado atual (objetivo e verificável)
- O domínio já decide corretamente via `EvaluateInstanceHealthUseCase` e emite `actions` (`ALLOW_DISPATCH`/`BLOCK_DISPATCH`/etc.).
- O heater atual ainda executa `dispatchPort.send(action)` sem um gate **pré-envio**; ele só reavalia depois ([heater.use-case.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/heater/heater.use-case.ts#L35-L55)).
- Já existe um gate pronto (`PreDispatchGuard`) que obedece o domínio ([pre-dispatch.guard.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/handlers/dispatch/pre-dispatch.guard.ts)).

## Objetivo do passo 11
- Transformar decisão em comportamento operacional: **nenhum envio acontece sem passar por PRE_DISPATCH**.
- Manter heater como executor burro: ele só executa um script compatível com fase e obedece `actions`.

## Decisão de arquitetura (mínima, sem novas camadas)
- Centralizar o gate no nível de `DispatchPort`, via decorator **na camada application** (não no provider e não no infra adapter).
- Reusar `PreDispatchGuard` (já existe), evitando inventar um novo “use case” redundante.

## Implementação
### 1) Criar `GuardedDispatchPort` (Application)
- Novo arquivo: `apps/server/src/application/heater/guarded-dispatch-port.ts`.
- `class GuardedDispatchPort implements DispatchPort` com dependências:
  - `inner: DispatchPort`
  - `guard: PreDispatchGuard`
- Regra simples (sem heurística):
  - Antes de ações que são “envio” (`SEND_TEXT`, `SEND_REACTION` e futuras) chamar `guard.ensureCanDispatch(instanceId, now)`.
  - Para ações não-envio (`SET_PRESENCE`, `MARK_AS_READ`) não bloquear (ou opcionalmente bloquear se você quiser “hard stop” total — eu mantenho como não-envio para reduzir falsos bloqueios).

### 2) Corrigir o Heater para ser executor burro
- Em [heater.use-case.ts](file:///d:/Projeto/WhatLead/apps/server/src/application/heater/heater.use-case.ts):
  - Manter a avaliação inicial `reason: "CRON"` como “semáforo global”.
  - Remover o `midHealth` pós-envio (`PRE_DISPATCH` depois do send) e confiar no gate pré-envio.
  - Tratar falha de dispatch como abort imediato (já existe).

### 3) Ligar no bootstrap (único lugar que importa)
- Em [index.ts](file:///d:/Projeto/WhatLead/apps/server/src/index.ts):
  - Instanciar `const preDispatchGuard = new PreDispatchGuard(evaluateInstanceHealth)`.
  - Wrapping: `const guardedDispatchPort = new GuardedDispatchPort(dispatchPort, preDispatchGuard)`.
  - Passar `guardedDispatchPort` para `HeaterUseCase`.

### 4) (Opcional, mas seguro) Blindar o heater “legado”
- Existe um use case antigo que chama provider direto ([domain/use-cases/heater.ts](file:///d:/Projeto/WhatLead/apps/server/src/domain/use-cases/heater.ts)).
- Como ele não está no bootstrap atual, não é runtime-critical.
- Opções:
  - A) Remover/desativar (se não usado)
  - B) Adicionar gate também (se você quer evitar regressão futura)

## Testes
- `GuardedDispatchPort`:
  - Quando `PreDispatchGuard` bloqueia, `inner.send` não é chamado em `SEND_TEXT`.
  - `SET_PRESENCE` passa sem chamar guard.
- `HeaterUseCase`:
  - Com `EvaluateInstanceHealthUseCase` retornando `BLOCK_DISPATCH`, não executa nenhuma ação.
  - Com `ALLOW_DISPATCH`, executa e registra eventos como hoje.

## Validação
- `pnpm -w check-types`
- `pnpm test:ci`

## Resultado esperado
- Gate obrigatório pré-envio garantido em um único ponto (DispatchPort).
- Heater vira executor puro: consome fase/plan e obedece o domínio; zero regra nova em provider/adapter.
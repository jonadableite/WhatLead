## Diagnóstico objetivo (estado atual)

* Existe execução de warmup via `HeaterUseCase` (Application) que:

  * consulta `EvaluateInstanceHealthUseCase(reason: "CRON")`

  * deriva `phase` via `instance.reputation.currentWarmUpPhase(now)`

  * executa `plan.actions` via `DispatchPort` e ingere `producedEvents`.

* O enforcement está correto: `GuardedDispatchPort` + `PreDispatchGuard` impede envio quando `BLOCK_DISPATCH`.

* Ainda não existe um **executor operacional** que:

  * gere um **WarmupPlan** explícito baseado no health,

  * aplique limites por janela (ex.: messages/hora, groups),

  * execute de forma lenta/variada/interrompível sem espalhar if.

* Também não há scheduler real wired; existem classes de cron (`HeaterCron`, `InstanceHealthCronJob`), mas sem agendamento no bootstrap.

## Objetivo do Step 14

* Criar um **Warmup Orchestrator** (Application) que executa aquecimento controlado, obedecendo o domínio via `EvaluateInstanceHealthUseCase` e os gates existentes.

* Introduzir `WarmupPlan` como **política operacional** (não-domínio) derivada do health.

## Entregáveis

### 1) DTO operacional: WarmupPlan

* Criar `apps/server/src/application/warmup/warmup-plan.ts`:

  * `instanceId`

  * `phase: "BOOT" | "SOFT" | "NORMAL"`

  * `allowedActions: WarmupAction[]` (mapeável para `DispatchAction`)

  * `maxMessagesPerHour`

  * `maxGroups`

  * `contentMix` (percentuais)

### 2) WarmupPlanFactory (policy, não domínio)

* Criar `apps/server/src/application/warmup/warmup-plan-factory.ts`:

  * `fromHealth(health)` usa apenas dados do `EvaluateInstanceHealthUseCaseResponse` (actions/risk/status/warmUpPhase).

  * Mapeia `warmUpPhase` do domínio → `BOOT/SOFT/NORMAL`.

  * Define limites e mix por fase de forma declarativa.

  * Não interpreta ban/report; não mexe em score.

### 3) Limiter por janela (reprodutível)

* Criar `apps/server/src/application/warmup/warmup-limiter.ts`:

  * Usa `GetReputationTimelineUseCase` para buscar últimos 60 min.

  * Conta sinais observáveis (`MESSAGE_SENT` com `source: "DISPATCH"` e/ou `REACTION_SENT` se você decidir que conta como “mensagem”).

  * Calcula “budget restante” com base em `maxMessagesPerHour`.

  * Faz contagem de grupos via `isGroup`/`remoteJid` quando aplicável.

### 4) WarmupOrchestrator (use case)

* Criar `apps/server/src/application/warmup/warmup-orchestrator.use-case.ts`:

  * `execute(instanceId, now)`:

    1. `health = EvaluateInstanceHealthUseCase.execute({ reason: "CRON", now })`
    2. Se `actions` não inclui `ALLOW_DISPATCH` ou inclui `ENTER_COOLDOWN` → retorna `null`.
    3. `plan = WarmupPlanFactory.fromHealth(health)`
    4. consulta `InstanceRepository.findById` apenas para obter dados necessários de alvo (mantendo o executor burro).
    5. usa `WarmUpTargetsProvider` + `WarmUpContentProvider` (templates estáticos versionados) para montar ações compatíveis com `contentMix`.
    6. aplica limiter para cortar N ações (budget/hora e maxGroups).
    7. executa N ações em sequência via `DispatchPort` (já protegido por `GuardedDispatchPort`):

       * se `DispatchPort` lançar (gate bloqueou) → interrompe silenciosamente.

       * se `result.success === false` → interrompe.

       * sempre ingere `producedEvents` via `MetricIngestionPort` para alimentar timeline.

  * Output do orchestrator: resumo com `executedActions`, `planPhase`, `stoppedBecause` (apenas para observabilidade).

### 5) Execução lenta (sem “inteligência falsa”)

* Introduzir um decorator opcional e reutilizável `DelayedDispatchPort` (Application):

  * se `action.delayMs` existir, aguarda (`await sleep(delayMs)`) antes de enviar.

  * sem regra de negócio; apenas pacing.

* O Orchestrator decide delays simples por fase (ex.: ranges), mas sem simular humano; só ritmo.

### 6) Cron chamando o Orchestrator

* Criar `WarmupOrchestratorCron` (similar ao `HeaterCron`) para rodar por instância.

* Manter o `HeaterUseCase` atual por compatibilidade ou migrar o `HeaterCron` para chamar o novo orchestrator.

## Testes (critérios de sucesso)

* `WarmupPlanFactory`: dados fixos de health → plano determinístico.

* `WarmupLimiter`: timeline com X sinais → budget restante correto.

* `WarmupOrchestrator`:

  * se health não permite → não executa.

  * executa N ações, ingere events, alimenta timeline.

  * interrupção automática quando gate bloqueia (`PreDispatchGuard`).

## Validação

* `pnpm -w check-types`

* `pnpm test:ci`

## Resultado esperado

* Cron (ou job) chama o Orchestrator.

* Orchestrator consulta saúde, gera (ou não) WarmupPlan.

* Executa N ações lentamente, com limite/hora e interrompível.

* Tudo vira sinais/timeline; cooldown interrompe sem if espalhado.


## Objetivo
- Implementar o adapter real de dispatch (infra) que traduz `DispatchAction` → `WhatsAppProvider`.
- Fazer o wiring no bootstrap do server usando `WhatsAppProviderFactory`.
- Ativar o aquecimento em modo seguro (1 ação por ciclo, sem texto).

## Passo 1 — Criar o adapter real (Infra)
- Criar [apps/server/src/infra/heater/whatsapp-dispatch-adapter.ts](file:///d:/Projeto/WhatLead/apps/server/src/infra/heater/) com `WhatsAppProviderDispatchAdapter implements DispatchPort`.
- Mapeamentos diretos (sem regra de negócio):
  - `SEND_TEXT` → `provider.sendText({ instanceId, to, text, delayMs })`
  - `SEND_REACTION` → `provider.sendReaction({ instanceId, to, messageId, emoji })` (usar `isReactionCapable` para capability)
  - `SET_PRESENCE` → `provider.setPresence({ instanceId, to, presence })` (usar `isPresenceCapable`)
  - `MARK_AS_READ` → `provider.markAsRead({ instanceId, messageId })` (usar `isPresenceCapable`)
- Tratamento técnico:
  - Se a capability não existir no provider, retornar `success: false` com erro explícito (não é regra de negócio).
  - Converter `MessageResult`/erros para `DispatchResult`.
  - (Opcional para manter loop e métricas enquanto webhook real não chega) retornar `producedEvents` mínimos (`MESSAGE_SENT`, `MESSAGE_FAILED`, `REACTION_SENT`, `MESSAGE_READ`, `CONNECTION_*` quando aplicável).

## Passo 2 — Registrar provider e criar instância real (Infra/Bootstrap)
- No bootstrap do server (atualmente em [apps/server/src/index.ts](file:///d:/Projeto/WhatLead/apps/server/src/index.ts)):
  - Chamar `registerTurboZapProvider()` antes de usar `WhatsAppProviderFactory.create(...)`.
  - Construir `ProviderConfig` via env:
    - `TURBOZAP_BASE_URL`
    - `TURBOZAP_API_KEY`
    - (opcional) `TURBOZAP_TIMEOUT_MS`
  - Criar `provider = WhatsAppProviderFactory.create("TURBOZAP", config)`.
  - Criar `dispatchPort = new WhatsAppProviderDispatchAdapter(provider)`.

## Passo 3 — Wiring do HeaterUseCase com dispatch real
- No container simples do server:
  - Instanciar `HeaterUseCase` com:
    - `instanceRepository`
    - `evaluateInstanceHealth`
    - `warmUpStrategy`
    - `dispatchPort` (real)
    - `metricIngestion`
- Manter o cérebro como fonte única (Heater continua fazendo `EvaluateInstanceHealth` antes e durante o loop).

## Passo 4 — Ativar em modo seguro (sem texto)
- Ajustar [HumanLikeWarmUpStrategy](file:///d:/Projeto/WhatLead/apps/server/src/application/heater/strategies/human-like.strategy.ts) para emitir **no máximo 1 ação** por ciclo e **sem SEND_TEXT** inicialmente:
  - Prioridade: `SET_PRESENCE` (ex.: composing/available) e, se houver dados, `MARK_AS_READ` e `SEND_REACTION`.
- Observação prática: para `MARK_AS_READ`/`SEND_REACTION` funcionar “de verdade”, a strategy precisa de `messageId` recente.
  - Se ainda não existir fonte, criar um port simples na application layer (ex.: `RecentInboundMessageProvider`) e um adapter infra que lê do store/eventos normalizados.

## Passo 5 — Testes (Vitest)
- Adicionar testes unitários do adapter `WhatsAppProviderDispatchAdapter`:
  - Mapeia cada `DispatchAction` para o método correto do provider.
  - Retorna erro quando capability não existe (ex.: provider sem `sendReaction`).
- Atualizar testes do HeaterUseCase se necessário (para lidar com `DispatchResult.success=false`).

## Passo 6 — Validação
- Rodar `pnpm -w check-types` e `pnpm test:ci`.
- Smoke manual:
  - Rodar server e acionar um ciclo de aquecimento (via cron interno, endpoint futuro ou script de teste).
  - Confirmar no log que:
    - `EvaluateInstanceHealth` roda com `reason=CRON` e `PRE_DISPATCH`.
    - O adapter chama o provider.
    - Se houver bloqueio, loop para imediatamente.

## Resultado esperado
- A arquitetura fica exatamente como você descreveu:
  - Domínio decide (health/actions)
  - Heater executa (sem regra)
  - Adapter traduz (sem regra)
  - Provider continua burro e plugável
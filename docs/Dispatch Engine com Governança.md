## Diagnóstico (estado real)
- Hoje existem **vários caminhos de envio** (warmup/heater, possivelmente campanha no futuro) e um gate genérico (`PreDispatchGuard`) que só responde ALLOW/BLOCK.
- Falta um **motor central auditável** que transforme uma “intenção de envio” em:
  - pode/não pode
  - limites (volume/intervalo)
  - tipos permitidos
  - motivo explícito (explicável)

## Objetivo
- Implementar o **Dispatch Engine com Governança**:
  - Use case (Application) recebe intenção (campanha/SDR/bot/humano/warmup)
  - Usa **DispatchPolicy (Domain Service)** para aplicar regras de negócio determinísticas
  - Produz **DispatchDecision (Value Object)** logável/auditável
  - Só depois chama um Port de envio (infra) para falar com provider

## Entregáveis
### 1) Domain: DispatchPolicy + DispatchDecision
- Criar `domain/services/dispatch-policy.ts` (Domain Service):
  - Entrada: `instance`, `instanceReputation`, `intent`, `messageType`, `now`
  - Saída: `DispatchDecision`
  - Regras explícitas (sem heurística “mágica”):
    - fase de warmup bloqueia tipos (ex.: sem mídia pesada/links)
    - reputação/risk em queda reduz volume e aumenta intervalo
    - status de conexão/lifecycle bloqueia
- Criar `domain/value-objects/dispatch-decision.ts` e `dispatch-block-reason.ts`:
  - `{ allowed, reason?, maxMessages, minIntervalSeconds, allowedMessageTypes }`

### 2) Application: DispatchUseCase (orquestra, não decide)
- Criar `application/dispatch/dispatch.use-case.ts` e DTOs:
  - `DispatchIntent` (source: CAMPAIGN | AGENT | BOT | HUMAN | WARMUP)
  - `DispatchRequest` (instanceId, to/contactId, messageType, payload)
  - `DispatchResult` (sent?, decision, producedEvents?)
- O use case:
  1) Carrega `Instance` e estado necessário (via repos atuais)
  2) Chama `EvaluateInstanceHealthUseCase` para gates reais (ENTER_COOLDOWN/BLOCK)
  3) Chama `DispatchPolicy` para gerar `DispatchDecision`
  4) Se allowed: chama `MessageDispatchPort` (Application Port)
  5) Sempre emite sinais observáveis (sucesso/falha/bloqueio) via `MetricIngestionPort` para entrar na timeline

### 3) Infra: Adapter do Provider (última etapa)
- Criar `infra/dispatch/whatsapp-message-dispatch-adapter.ts` implementando `MessageDispatchPort`:
  - Encapsula `WhatsAppProvider`
  - Produz `NormalizedWhatsAppEvent` (MESSAGE_SENT/MESSAGE_FAILED/...) para ingestão
  - Mantém provider fora do domínio

### 4) Integração com fontes de intenção (sem espalhar if)
- Migrar o **WarmupOrchestrator** para pedir envio via `DispatchUseCase` (intent = WARMUP), em vez de chamar provider/dispatch direto.
- Deixar pronto para Step 15/16/17:
  - Campaign/Agent/Human também passam pelo mesmo DispatchUseCase.

### 5) Testes + validação
- Testes unitários:
  - `DispatchPolicy` (matrix de warmup phase × messageType × status)
  - `DispatchUseCase` (bloqueio por health, allowed→envia, denied→não envia)
  - Adapter infra (mock provider → producedEvents)
- Validação:
  - `pnpm -w check-types`
  - `pnpm test:ci`

## Resultado esperado
- Qualquer tentativa de envio passa por um único ponto:
  - gera `DispatchDecision` explícita
  - aplica limites coerentes
  - emite sinais e entra na timeline
  - provider fica como detalhe de infra

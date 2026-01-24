## Diagnóstico (o que falta hoje)
- `Conversation` está viva e persistida; `InboundMessageUseCase` registra inbound; `OutboundMessageRecordedUseCase` registra outbound.
- `ConversationRouter` existe, mas **não fecha o loop**: ainda não há o caminho oficial `intenção → DispatchUseCase`.
- O estado da conversa ainda pode depender de webhook outbound (`MESSAGE_SENT`) em cenários onde o provider não confirma.

## Objetivo do Step 7 (escopo fechado)
- Criar o caminho único e oficial:
  - `Inbound → Router → ReplyIntent → DispatchUseCase → OutboundMessageRecordedUseCase`
- Garantias:
  - ninguém envia direto (somente via `DispatchUseCase`)
  - bloqueio do Dispatch vira **no-op silencioso** para auto-reply
  - outbound registrado mesmo sem webhook

## Entregáveis

### 1) Formalizar ReplyIntent (Application VO)
- Criar `application/conversation/reply-intent.ts`:
  - `conversationId`, `instanceId`
  - `type: TEXT | REACTION | NONE` (deixar TEMPLATE para depois)
  - `payload` tipado por `type`
  - `reason: AUTO_REPLY | BOT | FOLLOW_UP`

### 2) Evoluir ConversationRouter para sempre emitir ReplyIntent
- Ajustar `RoutingDecision` para sempre conter `replyIntent` (mesmo `NONE`).
- Regras iniciais simples e determinísticas:
  - inbound + `instance.purpose === WARMUP` → `replyIntent = NONE` e `markWaiting = true`
  - inbound + `conversation.assignedAgentId` existe → `replyIntent = NONE`
  - inbound + `stage === LEAD` + sem agente → `replyIntent = TEXT` (ack curto) apenas se `lastOutboundAt == null` (evita spam)
  - restante → `replyIntent = NONE` (ou `markWaiting` quando não houver SDR online)

### 3) Criar ReplyIntentDispatcher (Application Service)
- Criar `application/conversation/reply-intent-dispatcher.ts`:
  - `execute(intent: ReplyIntent)`:
    - `NONE` → retorna
    - `TEXT/REACTION` → traduz para `DispatchRequest` e chama `DispatchUseCase`
    - se `DispatchUseCase` retornar `BLOCKED` → **no-op silencioso**
    - se `FAILED` → retorna erro (sem jogar exceção no pipeline)
- Sem regra de negócio aqui (somente tradução/execução governada).

### 4) Fechar o loop no pipeline de inbound
- Evoluir `ConversationEventPipelineUseCase` para:
  - `InboundMessageUseCase.execute(event)` passar a retornar `{ conversationId } | null` quando houver inbound
  - pipeline:
    1. registrar inbound (cria/atualiza conversa)
    2. carregar `Conversation` e `Instance` (repos atuais)
    3. `router.route(...)` → `RoutingDecision`
    4. `AssignConversationUseCase.execute(...)`
    5. `ReplyIntentDispatcher.execute(decision.replyIntent)`
  - manter `OutboundMessageRecordedUseCase.execute(event)` para webhooks `MESSAGE_SENT` como confirmação eventual

### 5) Registrar outbound sem depender de webhook
- Ajustar `DispatchUseCase` para aceitar um `OutboundMessageRecordedUseCase` (ou uma interface `OutboundRecorder`) via constructor.
- Após `dispatchPort.send(...)` retornar `producedEvents`, além de `metricIngestion.recordMany(...)`:
  - chamar `OutboundMessageRecordedUseCase.execute(event)` para eventos `type === MESSAGE_SENT` (source DISPATCH), garantindo atualização de `Conversation.lastOutboundAt` mesmo sem webhook.

## Critério de “feito”
- Auto-reply nasce como `ReplyIntent` e **sempre** passa por `DispatchUseCase`.
- `DispatchUseCase` bloqueado não gera resposta automática (no-op) e não quebra pipeline.
- `Conversation.lastOutboundAt` atualiza no envio governado, mesmo sem webhook.

## Testes e validação
- Testar `ConversationRouter`:
  - WARMUP → replyIntent NONE
  - LEAD + sem agente + sem lastOutboundAt → replyIntent TEXT
- Testar `ReplyIntentDispatcher`:
  - BLOCKED → no-op
  - SENT → chama DispatchUseCase
- Testar pipeline inbound end-to-end (com repos in-memory):
  - inbound → cria conversa → gera replyIntent → chama DispatchUseCase
- Validar: `pnpm -w check-types` e `pnpm test:ci`.
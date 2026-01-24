## Objetivo (escopo fechado)
- Provar valor percebido: **Lead → Conversation → AgentOrchestrator → Intent → DispatchGate → Dispatch → registro → inbound atualiza Lead.stage**.
- Sem ML, sem automações genéricas, sem UI complexa; apenas um caso completo e auditável.

## Estado atual (o que já existe e vamos reutilizar)
- `Lead` (entidade rica) + `LeadRepository` (Prisma) e `Conversation.leadId` já persistido.
- `AgentOrchestratorUseCase` já consegue gerar um `DispatchIntent`.
- `DispatchGateUseCase` é o único enforcement point (health/policy/rate/SLA) e tem auditoria opcional.
- `ConversationEventPipelineUseCase` já é o pipeline oficial de inbound.

## Entregas do Step 8 (MVP)

### 1) Use cases: criar lead + abrir conversa outbound-first
- Criar `CreateLeadUseCase` (Application):
  - cria `Lead` com `stage: NEW` e salva.
- Criar `OpenConversationForLeadUseCase` (Application):
  - abre `Conversation.open(...)` com `tenantId` vindo da `Instance.companyId`, seta `leadId` via `conversation.linkLead(lead.id)`, salva.
- Criar `StartSdrFlowUseCase` (Application):
  - orquestra: `CreateLeadUseCase` → `OpenConversationForLeadUseCase` → `AgentOrchestrator.execute(conversationId)`.
  - transforma o `DispatchIntent` retornado em `DispatchUseCase.execute({ instanceId, conversationId, intent.source: AGENT, message })`.
  - se enviado com sucesso: atualiza `Lead.stage` para `CONTACTED` e salva.

### 2) Playbook mínimo por Agent (sem ML)
- Introduzir `AgentPlaybook` (Application/Domain service simples e determinístico):
  - SDR: só para `Lead.stage in [NEW]` e `Conversation.stage == LEAD`, 1 tentativa/dia (sem storage extra agora: usar Gate + contagem do snapshot como proxy inicial).
  - FOLLOW_UP: apenas quando `Conversation` estiver `BREACHED` (já protegido pelo Gate).
- `AgentOrchestratorUseCase` passa a consultar playbook para escolher qual intent gerar (sem enviar).

### 3) Inbound atualiza estado do Lead (valor de produto)
- Criar `UpdateLeadOnInboundUseCase` (Application):
  - input: `conversationId`, `event` (inbound), `now`.
  - busca `Conversation` → se `leadId` existir, busca `Lead`.
  - regra mínima e explícita:
    - se Lead `NEW/CONTACTED` e chega `MESSAGE_RECEIVED` do contato → `Lead.stage = QUALIFIED`.
  - salva `Lead`.
- Integrar no `ConversationEventPipelineUseCase` logo após `inbound.execute` (sem bypass).

### 4) Visualização mínima (produto visível)
- Criar `infra/routes/sdr-flow.routes.ts` e registrar no `index.ts`.
- Endpoints mínimos (JSON):
  - `POST /api/sdr/leads` → cria lead + abre conversa + dispara fluxo SDR.
    - body: `{ tenantId, instanceId, contactId, name, email, phone }`
    - response: `{ leadId, conversationId, dispatchResult, gateDecision? }`
  - `GET /api/sdr/leads/:id` → retorna Lead + conversa vinculada + últimas decisões (se recorder habilitado).

### 5) Auditoria de decisões (ligar para o MVP)
- No bootstrap (`index.ts`), habilitar `InMemoryDispatchGateDecisionRecorder` e injetar no `DispatchGateUseCase`.
- Expor no endpoint `GET` apenas para debug/MVP (sem persistência ainda).

## Testes (critério de pronto)
- `StartSdrFlowUseCase`:
  - cria Lead e Conversation vinculada (`leadId`), chama orchestrator, chama dispatch, atualiza `Lead.stage` para `CONTACTED` quando enviado.
- `UpdateLeadOnInboundUseCase`:
  - inbound em conversa com `leadId` muda `Lead.stage` para `QUALIFIED`.
- Teste de rota (opcional, se houver harness) ou teste de use cases com repositórios in-memory.
- Validação: `pnpm -w check-types` e `pnpm test:ci`.

## Resultado do Step 8 (MVP)
- Primeiro caso de uso completo demonstrável: o WhatLead passa a “fechar loop” de negócio (captura → contato → resposta → qualificação), com Gate garantindo governança e auditoria explicável.
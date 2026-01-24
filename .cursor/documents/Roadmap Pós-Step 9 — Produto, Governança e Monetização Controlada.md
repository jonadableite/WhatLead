## Leitura do estado atual (alinhamento)
- `Conversation` já carrega **estado operacional** (status/stage, unread, timestamps, SLA) e o envio passa por um **gate único**.
- `Agent` existe no domínio hoje como “operador lógico” (role/status + organizationId), mas **ainda não modela IA** (purpose, bindings, limites, etc.).
- `Lead` existe, porém ainda é um **anêmico** (campos públicos, sem invariantes) e não tem repositório/persistência.
- Multi-empresa existe “por convenção” (`tenantId`/`organizationId`/`companyId`), mas a linguagem ainda não está unificada.

## Objetivo macro (próximos passos)
- Virar produto: **IA SDR operacional** + **governança por empresa** + **monetização via limites/planos**, sem cair em “automação mágica” nem ML.

## Sequência recomendada (executável, sem dispersão)

### STEP 1 — Consolidar o Modelo de AI Agent vs Operator
**Meta:** consolidar linguagem e limites do “ator” que gera intents.
- **Ubiquitous language:**
  - `Agent` = IA (sempre)
  - `Operator` = humano (usuário)
  - `Tenant/Organization` = empresa (escolher um e padronizar)
- **Evoluir Domain Agent:**
  - `purpose` (SDR/FOLLOW_UP/QUALIFICATION/WARMUP)
  - `allowedStages` (LEAD/QUALIFIED/…)
  - `tone`
  - `maxDailyInteractions`
  - `channelBindings` (allowed instanceIds)
- **Criar Application “ActorContext” (sem infra):**
  - `actorType: AGENT|OPERATOR|SYSTEM`
  - `actorId?`, `tenantId`, `instanceId`.

**Critério de pronto:** qualquer intenção relevante carrega “quem pediu” sem vazar para o domínio.

### STEP 2 — CRM mínimo porém correto
**Meta:** estruturar o CRM para suportar produto (sem automação).
- **Refatorar Lead para entidade rica:**
  - invariantes, mudanças via métodos (sem campos públicos)
  - stages e transições explícitas
- **Persistência mínima:**
  - `LeadRepository` + implementação (Prisma)
  - relacionamentos:
    - Lead pertence a Tenant
    - Conversation referencia `leadId` (ou uma tabela de associação se preferir)
- **Pipeline/Stage:**
  - manter `ConversationStage` como “visão da conversa”
  - introduzir `Pipeline`/`PipelineStage` como visão do CRM (ou mapear 1:1 inicialmente)

**Critério de pronto:** “um lead pode ter várias conversas” e “a conversa sabe qual lead representa”, com invariantes claras.

### STEP 3 — Funil dirigido por eventos (não por timers)
**Meta:** transicionar de “CRUD” para “processo rastreável”.
- **Domínio emite eventos:**
  - `ConversationBecameWaiting`, `ConversationSlaBreached`, `LeadStageChanged`, etc.
- **Application normaliza eventos → Intents:**
  - Event → Intent (Reply/FollowUp/DispatchIntent)
  - Intent → DispatchGate → Send/Delay/Block
- **Auditoria de decisão:**
  - registrar `GateDecision` (allowed/blocked/delayed + reason) em storage de eventos/sinais (sem precisar UI ainda)

**Critério de pronto:** toda mudança relevante gera evento e pode ser reconstruída (ML-ready).

### STEP 4 — Orquestrador de Agents (sem ML)
**Meta:** “cérebro” plugável que escolhe qual agent age.
- `AgentOrchestratorUseCase`:
  - escolhe o agent com base em contexto (lead stage, SLA, purpose, bindings)
  - gera `DispatchIntent`/`ReplyIntent`/`FollowUpIntent`
  - nunca envia direto

**Critério de pronto:** decisões de *quem age* separadas de *se pode enviar* (Gate).

### STEP 5 — Multi-empresa com isolamento real (governança + monetização)
**Meta:** limites por tenant e proteção contra “cliente grande” derrubar o resto.
- Evoluir `DispatchIntent` para carregar `tenantId` e `actorType/actorId`.
- Evoluir RateSnapshot para suportar agregação por:
  - `instanceId` (já)
  - `tenantId` (novo)
  - opcional `agentId` (depois)
- Introduzir `PlanPolicy` (Application/Domain service) com limites por plano:
  - mensagens/dia, mensagens/minuto, follow-ups/hora, etc.

**Critério de pronto:** gate decide também com base no plano, sem duplicar regras em feature.

### STEP 6 — Painel de Controle (produto visível)
**Meta:** transparência vende e reduz suporte.
- Expor métricas essenciais:
  - sent/blocked/delayed
  - razões (SLA/rate/policy/health)
  - saúde da instância
  - performance por agent

**Critério de pronto:** operador consegue entender “por que não enviou” sem olhar logs.

### STEP 7 — ML/LLM depois (estratégia, não fundação)
**Meta:** usar dados limpos e labels reais.
- Inputs: eventos + decisões do gate + outcomes.
- ML entra como estratégia plugável (`I…Evaluator` / `I…OrchestratorPolicy`).

## Próxima ação imediata (sem mudar a ordem)
- Começar o STEP 1: **consolidar o modelo de Agent IA vs Operator + ActorContext** e padronizar linguagem `tenant/company/organization`.

Se você aprovar, o próximo ciclo de implementação começa por STEP 1 (Domain Agent + ActorContext + ajustes mínimos no DispatchIntent para carregar actor/tenant), mantendo o DispatchGate como o único enforcement point.
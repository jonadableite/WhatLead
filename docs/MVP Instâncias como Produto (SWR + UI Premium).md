## Entendimento (o que precisa existir AGORA)
- **Instance é produto**: precisa ser visível, acionável e auditável no app.
- **Sem provider ainda**: ações `Conectar/Reconectar` não conectam WhatsApp; apenas registram intenção e atualizam estado.
- **UI não decide nada**: `riskLevel`, `allowedActions`, status e mensagens (“Apta para aquecer”, “Bloqueada”, “Em cooldown”) vêm do backend/domínio.
- **SWR obrigatório**: fetch declarativo, cache e revalidação automática.

## 1) Contrato do Produto (DTOs + Endpoints REST para SWR)
Vou expor endpoints JSON no **apps/server** (para serem consumidos via `useApiSWR` e `apiFetch` em `apps/web`).

### Endpoints
- `GET /api/instances`
  - Lista instâncias **da organização ativa** (derivada da sessão Better Auth no server).
- `POST /api/instances`
  - Cria instância (sem provider):
    - `lifecycleStatus = CREATED`
    - `connectionStatus = DISCONNECTED`
    - `purpose = WARMUP | DISPATCH | MIXED`
    - `reputation = NEW/NEUTRAL` (na prática: `InstanceReputation.initialize`)
- `GET /api/instances/:id`
  - Detalhe + resumo de saúde (inclui `riskLevel`, `allowedActions`, `healthLabel`).
- `POST /api/instances/:id/connect`
  - Registra intenção de conectar: `markConnecting()`.
- `POST /api/instances/:id/reconnect`
  - Registra intenção de reconectar: `markConnecting()` + evento de intenção.
- `POST /api/instances/:id/health/evaluate`
  - Executa `EvaluateInstanceHealthUseCase` (reason=`CRON`/`PRE_DISPATCH`) e retorna snapshot.
- `GET /api/instances/:id/health`
  - Retorna o último snapshot (sem forçar reavaliação).
- (Opcional) `GET /api/instances/:id/events`
  - Auditoria simples (eventos de domínio relacionados).

### DTO do list item (exemplo)
- `id`, `name`, `numberMasked`
- `lifecycleStatus`, `connectionStatus`
- `riskLevel` (LOW|MEDIUM|HIGH)
- `allowedActions` (ex.: CONNECT, RECONNECT, VIEW_HEALTH, BLOCK_DISPATCH, ALLOW_DISPATCH, ALERT)
- `healthLabel` (string curta: “Aguardando conexão”, “Em cooldown”, “Apta para aquecer”, “Bloqueada”)

## 2) Ajustes mínimos no Domínio (para suportar “produto”)
Hoje `Instance` tem `companyId/engine/purpose/status`, mas **não tem `name` e `number`**.

Vou adicionar ao agregado:
- `displayName: string`
- `phoneNumber: string` (armazenado), e um método `getMaskedPhoneNumber()` (mask no domínio, não na UI)

Também vou expandir `InstanceHealthAction` para incluir ações de produto:
- `CONNECT`, `RECONNECT`, `VIEW_HEALTH` (e manter as existentes)

E atualizar `Instance.allowedActions()` para decidir ações de conexão (sem provider):
- Se `lifecycleStatus === BANNED` → bloquear tudo (exceto talvez VIEW_HEALTH).
- Se `connectionStatus === DISCONNECTED|ERROR` e não banned → `CONNECT`/`RECONNECT` conforme contexto.
- Sempre permitir `VIEW_HEALTH`.

## 3) Repositórios e Infra (sem provider, mas com persistência real)
No estado atual não existe `Instance` no Prisma.

Vou criar persistência via Prisma em `packages/db/prisma/schema/instance.prisma`:
- `InstanceModel`: `id`, `organizationId`(=tenant), `displayName`, `phoneNumber`, `purpose`, `engine`, `lifecycleStatus`, `connectionStatus`, `createdAt`, `lastConnectedAt`
- Manter `InstanceReputation` separado (já existe no schema de reputação) e relacionar por `instanceId`.

Vou atualizar contratos:
- `InstanceRepository`: adicionar `create(instance)`, `listByCompanyId(companyId)`, `findById(companyId, id)`.

Infra:
- Implementar `PrismaInstanceRepository` (e adaptar os in-memory para testes/dev).

## 4) Use Cases (orquestração fina, sem regras)
Novos use cases (application/domain use-cases) para cumprir o MVP:
- `CreateInstanceUseCase`
  - cria `Instance` + `InstanceReputation.initialize`.
- `ListCompanyInstancesUseCase`
  - lista e mapeia para DTO (inclui `riskLevel` e `allowedActions`).
- `GetInstanceUseCase`
  - detalhe + `healthLabel` derivado.
- `RequestInstanceConnectUseCase` / `RequestInstanceReconnectUseCase`
  - apenas muda `connectionStatus` e publica evento de intenção.
- `EvaluateInstanceHealthOnDemandUseCase`
  - chama `EvaluateInstanceHealthUseCase` e retorna snapshot.

## 5) Resolver Tenant corretamente (UI não envia orgId)
Vou padronizar no server que `companyId` = `activeOrganizationId` do Better Auth.
- Reuso da mesma lógica já existente em `/api/tenants/me`.
- Endpoints de instances sempre derivam tenant do **cookie/session**.

## 6) Frontend (Premium UI + SWR) — telas em ordem correta
Vou implementar as telas no Next App Router, consumindo os endpoints REST com:
- `useApiSWR` (já existe em [swr.ts](file:///d:/Projeto/WhatLead/apps/web/src/lib/api/swr.ts))
- `apiFetch` para POST/ações

### 6.1 `/instances` (lista)
- Layout premium (glass + glow), responsivo:
  - **Mobile**: cards empilhados com ações em linha dupla.
  - **Desktop**: grid/table-like com colunas (Nome, Número, Status, Risco, Ações).
- Ações contextuais renderizadas a partir de `allowedActions` (UI só exibe).

### 6.2 `/instances/new` (criação)
- Form premium:
  - Nome
  - Número (com máscara visual, mas validação/normalização no backend)
  - Purpose (WARMUP/DISPATCH/MIXED)
  - Engine (TURBOZAP/EVOLUTION) com descrição
- Ao salvar: mostra “Instância criada, aguardando conexão” e redireciona para `/instances/:id`.

### 6.3 `/instances/:id` (detalhe + saúde)
- Header com status pills (lifecycle/connection) + risk badge.
- Card “Saúde agora” com `healthLabel`, `alerts`, `allowedActions`.
- Botões: Conectar / Reconectar / Ver saúde.

### 6.4 `/instances/:id/health`
- View detalhada do output do `EvaluateInstanceHealthUseCase`:
  - `temperatureLevel`, `riskLevel`, `warmUpPhase`, `cooldownReason`, `signalsSnapshot`
- Botão “Reavaliar agora” (POST `/health/evaluate`) e SWR mutate.

### 6.5 “Plataforma cinza” (Regra de ouro)
- Criar `InstanceGate` (Client Component) aplicado no layout dashboard:
  - Se não existe instância OU nenhuma está saudável, o app exibe overlay + CTA “Criar instância” e deixa o resto visualmente “cinza”.
  - Exceção: rotas `/instances*` continuam acessíveis.

## 7) Loop vivo (cron) sem provider
- Implementar um scheduler simples no server (setInterval) que roda `EvaluateInstanceHealthUseCase` para todas as instances a cada X minutos.
- Isso valida domínio/eventos/métricas mesmo sem WhatsApp real.

## 8) Verificação
- `pnpm check-types`
- `pnpm -F web build`
- Smoke test manual:
  - Criar instância → aparece em `/instances`
  - Conectar/Reconnecting → muda `connectionStatus` e `allowedActions`
  - Ver saúde / Reavaliar → atualiza `riskLevel`/label
  - Sem instâncias → overlay “cinza” no restante do app

Se você confirmar, começo pela ordem correta: **endpoints + repo + create/list** (para o frontend já ter dados reais), depois as telas e por último o “cinza global”.
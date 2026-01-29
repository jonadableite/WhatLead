# Notion Planning

## 2026-01-24 - Fase 4 (Produto Operacional)

### O que foi feito - Fase 4

- [x] Conexão de instâncias com QR Code e status em tempo real
- [x] Listagem de Message Intents com filtros para auditoria
- [x] Camada de API no frontend para ops/metrics/timeline
- [x] Fluxo de criação de instância em 3 etapas
- [x] Painel operacional com abas (Visão geral, Métricas, Auditoria, Configurações)
- [x] Tela global de Message Intents com timeline

### Arquivos alterados - Fase 4

- `apps/server/src/index.ts` - Wiring de use cases de conexão e listagem de intents
- `apps/server/src/application/message-intents/list-message-intents.use-case.ts` - Listagem com filtros
- `apps/server/src/infra/web/message-intents.routes.ts` - GET `/api/message-intents`
- `apps/web/src/lib/ops/*` - API client + tipos de métricas/timeline
- `apps/web/src/lib/instances/*` - Status traduzidos + endpoints de conexão
- `apps/web/src/app/(dashboard)/instances/*` - Fluxo de instâncias e onboarding
- `apps/web/src/app/(dashboard)/message-intents/*` - Tela global de intents

### Decisões arquiteturais - Fase 4

- UI apenas renderiza estados do backend (Gate/Use Cases), sem lógica de decisão no frontend
- Status críticos sempre revalidados via SWR após ações (pause/resume/connect)
- Métricas iniciais em cards simples (sem gráficos) para reduzir complexidade

### Próximos passos - Fase 4

- [ ] Refinar empty states e mensagens de risco com base em uso real
- [ ] Testes de smoke para páginas principais
- [ ] Validar UX mobile para onboarding e auditoria

---

## 2026-01-24 - Ajustes Fase 4 + Início Fase 5 (Execution Engine)

### O que foi feito - Fase 5

- [x] Polling inteligente no onboarding (reduz custo quando CONNECTED)
- [x] Banner de alerta reutilizável para risco/cooldown
- [x] Base do Execution Engine com fila BullMQ e worker dedicado
- [x] Use case de execução com provider adapter isolado
- [x] Testes unitários para execução e criação de jobs

### Arquivos alterados - Fase 5

- `apps/web/src/components/ui/alert-banner.tsx` - Banner reutilizável de alertas
- `apps/web/src/components/instances/qr-code-connection-step.tsx` - Polling inteligente
- `apps/server/src/infra/queue/bullmq-execution.queue.ts` - Implementação BullMQ
- `apps/server/src/infra/workers/execution.worker.ts` - Worker de execução
- `apps/server/src/application/execution/*` - Entidades, ports e use cases
- `apps/server/src/infra/providers/whatsapp/whatsmeow.adapter.ts` - Adapter de envio
- `packages/env/src/server.ts` - Vars de Redis e toggle de fila

### Decisões arquiteturais - Fase 5

- Execution Engine iniciado via fila (BullMQ) com flag `EXECUTION_QUEUE_ENABLED`
- Sem duplicar regra de negócio: Gate continua o único decisor
- Worker executa apenas jobs aprovados e re-enfileira em retry controlado
- Cron permanece como fallback em dev até a fila estabilizar

### Próximos passos - Fase 5

- [ ] Validar Redis em ambiente local/staging
- [ ] Ajustar métricas de execução para observabilidade
- [ ] Remover cron de execução quando a fila estiver madura

---

## 2026-01-24 - Fase 6 (Control Plane + UX)

### O que foi feito - Fase 6

- [x] Endpoints de detalhe de intent e jobs por intent para control plane
- [x] Componentes reutilizáveis de status, risco e saúde da instância
- [x] Tela de Message Intents com detalhes e execução (admin via flag)

### Arquivos alterados - Fase 6

- `apps/server/src/application/message-intents/get-message-intent.use-case.ts` - Detalhe do intent
- `apps/server/src/application/message-intents/message-intent-detail-view-model.ts` - View model de detalhe
- `apps/server/src/infra/web/message-intents.routes.ts` - GET `/api/message-intents/:id`
- `apps/server/src/application/execution/list-execution-jobs.use-case.ts` - Listagem por intent
- `apps/server/src/application/execution/execution-job-list-view-model.ts` - View model de jobs
- `apps/server/src/infra/web/execution-jobs.routes.ts` - GET `/api/execution-jobs`
- `apps/web/src/components/ui/status-badge.tsx` - Badge de status
- `apps/web/src/components/ui/risk-indicator.tsx` - Indicador de risco
- `apps/web/src/components/ui/execution-state-chip.tsx` - Chip de execução
- `apps/web/src/components/ui/instance-health-meter.tsx` - Medidor de saúde
- `apps/web/src/app/(dashboard)/message-intents/message-intents-page-client.tsx` - Detalhes + jobs

### Decisões arquiteturais - Fase 6

- Control plane expõe apenas leitura (detalhe de intent + jobs)
- Seção de jobs protegida por flag (`showJobs=1`) para uso interno

### Próximos passos - Fase 6

- [ ] Ajustar estados vazios e erros na tela de intents
- [ ] Validar UX mobile no painel de control plane

---

## 2026-01-28 - Ajustes Chat CRM + Operator View

### O que foi feito

- [x] MessageIntent agora registra `origin` (ex: CHAT_MANUAL) sem novos purposes
- [x] Message.status simplificado para `PENDING | SENT | FAILED`
- [x] Conversation agora suporta `assignedOperatorId` (ownership humano)
- [x] CRUD operacional de operadores (listar, assign, release, transfer)
- [x] Operator View (fila + minhas conversas)

### Arquivos alterados

- `packages/db/prisma/schema/message-intent.prisma` - campo `origin`
- `packages/db/prisma/schema/conversation.prisma` - `status` em Message + `assignedOperatorId`
- `packages/db/prisma/schema/auth.prisma` - tabela `Operator`
- `apps/server/src/domain/*` - entidades/value-objects de Operator e MessageIntent/Message
- `apps/server/src/application/operators/*` - use cases de operadores
- `apps/server/src/infra/web/operators.routes.ts` - endpoints de operadores
- `apps/server/src/infra/repositories/*` - repos de operadores e updates de conversa
- `apps/web/src/app/(dashboard)/operator/*` - Operator View
- `apps/web/src/components/operator/*` - componentes de fila e minhas conversas

### Decisões arquiteturais

- `origin` em MessageIntent evita explosão de purposes e facilita métricas futuras
- Ownership humano separado de Agent via `assignedOperatorId` sem misturar responsabilidades
- Status de Message reduzido para evitar heurísticas de delivery no core

### Próximos passos

- [ ] Associar Operator ao usuário logado (auto-seleção na UI)
- [ ] Incluir filtros por operador na listagem de conversas

---

## 2026-01-28 - Phase 6 (Operator UX & Security)

### O que foi feito

- [x] Mensagens outbound agora iniciam como `PENDING` e são confirmadas como `SENT` via webhook
- [x] Operadores agora usam contagem recalculada para evitar drift de workload
- [x] Claim de conversa com lock otimista (evita dupla atribuição)
- [x] Endpoint `/api/operators/me` para auto-seleção do operador
- [x] Filtro por operador + fila no `GET /api/conversations`

### Arquivos alterados

- `apps/server/src/application/conversations/send-chat-message.use-case.ts` - cria Message PENDING
- `apps/server/src/application/use-cases/outbound-message-recorded.use-case.ts` - atualiza para SENT
- `apps/server/src/domain/entities/conversation.ts` - métodos de pending/confirm
- `apps/server/src/domain/repositories/message-repository.ts` - novos métodos de update
- `apps/server/src/infra/repositories/*message-repository.ts` - update de delivery
- `apps/server/src/infra/repositories/*conversation-repository.ts` - assign otimista + filtro operador
- `apps/server/src/infra/web/operators.routes.ts` - `/me`
- `apps/server/src/infra/web/conversations.routes.ts` - query operatorId/includeUnassigned
- `apps/web/src/app/(dashboard)/operator/operator-page-client.tsx` - auto-select operador

### Decisões arquiteturais

- Mensagem outbound PENDING evita confundir persistência com envio real
- Count de operador tratado como cache, recalculado em operações críticas
- Optimistic locking aplicado no claim para evitar race conditions

### Próximos passos

- [ ] Registrar audit log para assign/release/transfer (OperationalEvent)
- [ ] Estratégia de auto-assign (round-robin / menor carga)

---

## 2026-01-29 - Phase 7 (Realtime Gateway)

### O que foi feito

- [x] Gateway WebSocket `/realtime` com autenticação via sessão
- [x] Broadcast de eventos `MESSAGE_RECEIVED`, `MESSAGE_SENT`, `MESSAGE_STATUS_UPDATED`
- [x] Hook `useRealtime` no frontend com reconexão automática
- [x] Chat CRM reagindo a eventos em tempo real (SWR revalidate)

### Arquivos alterados

- `apps/server/src/infra/realtime/websocket-gateway.ts` - Gateway WS e subscriptions
- `apps/server/src/infra/event-bus/realtime-domain-event-publisher.ts` - Publisher realtime
- `apps/server/src/domain/events/chat-message-events.ts` - Eventos de mensagem
- `apps/server/src/application/use-cases/inbound-message.use-case.ts` - Emissão de eventos inbound
- `apps/server/src/application/use-cases/outbound-message-recorded.use-case.ts` - Emissão de eventos outbound
- `apps/server/src/application/conversations/send-chat-message.use-case.ts` - Emissão status PENDING/FAILED
- `apps/server/src/index.ts` - Registro do WS + wiring do event bus
- `apps/web/src/lib/realtime/use-realtime.ts` - Hook de WebSocket
- `apps/web/src/app/(dashboard)/chat/chat-page-client.tsx` - Integração realtime no Chat CRM

### Decisões arquiteturais

- Eventos de chat são isolados em bus específico para evitar logging com PII
- Realtime envia payload mínimo e usa SWR para revalidar dados críticos

### Próximos passos

- [ ] Exibir status da conexão WS na UI do Chat CRM
- [ ] Integrar eventos de delivery/read assim que disponíveis no provider

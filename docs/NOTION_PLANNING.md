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

### Próximos passos - Fase 5

- [ ] Validar Redis em ambiente local/staging
- [ ] Ajustar métricas de execução para observabilidade

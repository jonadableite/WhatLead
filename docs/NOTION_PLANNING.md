## ✅ 2026-01-24 - Fase 4 (Produto Operacional)

### O que foi feito:
- [x] Conexão de instâncias com QR Code e status em tempo real
- [x] Listagem de Message Intents com filtros para auditoria
- [x] Camada de API no frontend para ops/metrics/timeline
- [x] Fluxo de criação de instância em 3 etapas
- [x] Painel operacional com abas (Visão geral, Métricas, Auditoria, Configurações)
- [x] Tela global de Message Intents com timeline

### Arquivos alterados:
- `apps/server/src/index.ts` - Wiring de use cases de conexão e listagem de intents
- `apps/server/src/application/message-intents/list-message-intents.use-case.ts` - Listagem com filtros
- `apps/server/src/infra/web/message-intents.routes.ts` - GET `/api/message-intents`
- `apps/web/src/lib/ops/*` - API client + tipos de métricas/timeline
- `apps/web/src/lib/instances/*` - Status traduzidos + endpoints de conexão
- `apps/web/src/app/(dashboard)/instances/*` - Fluxo de instâncias e onboarding
- `apps/web/src/app/(dashboard)/message-intents/*` - Tela global de intents

### Decisões arquiteturais:
- UI apenas renderiza estados do backend (Gate/Use Cases), sem lógica de decisão no frontend
- Status críticos sempre revalidados via SWR após ações (pause/resume/connect)
- Métricas iniciais em cards simples (sem gráficos) para reduzir complexidade

### Próximos passos:
- [ ] Refinar empty states e mensagens de risco com base em uso real
- [ ] Testes de smoke para páginas principais
- [ ] Validar UX mobile para onboarding e auditoria

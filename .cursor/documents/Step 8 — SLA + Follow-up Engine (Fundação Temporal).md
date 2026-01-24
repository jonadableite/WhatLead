## Veredito (alinhado ao estado atual)
- Concordo com o diagnóstico: o WhatLead hoje fecha o loop reativo (inbound → decisão → envio), mas não tem **tempo como regra de negócio**.
- O Step 8 correto é introduzir **SLA explícito** dentro da `Conversation` e um **avaliador determinístico** (sem cron ainda), porque isso vira:
  - ground truth para cobrança/SDR
  - gatilho seguro para follow-up
  - base para reputação/qualidade (sem depender da Meta)

## Escopo desta entrega (fechado, sem dispersão)
- Implementar **SLA no domínio** + **SLAEvaluator** + invariantes na `Conversation`.
- Persistir o SLA na tabela `Conversation` de forma queryável (para o scheduler futuro).
- Implementar o VO de `FollowUpIntent` (irmão do ReplyIntent), mas **não** criar Scheduler/cron agora.

## 1) Domain: ConversationSLA + SLAStatus + SLAEvaluator
### Arquivos novos
- `domain/value-objects/conversation-sla.ts`
  - `{ firstResponseDueAt?: Date; nextResponseDueAt?: Date; breachedAt?: Date }`
  - construtores estáticos (ex.: `startFirstResponse(now, dueAt)`, `startNextResponse(...)`, `clear()`, `markBreached(now)`)
- `domain/value-objects/sla-status.ts`
  - `OK | DUE_SOON | BREACHED`
- `domain/services/sla-evaluator.ts`
  - `evaluate(conversation, now) → SLAStatus`
  - thresholds simples e explícitos (ex.: DUE_SOON = faltando <= 5min)

### Evolução da Conversation (regras dentro da entidade)
- Adicionar `sla?: ConversationSLA | null` em `ConversationProps`.
- Atualizar métodos:
  - `receiveInboundMessage(...)`:
    - se conversa ativa e inbound chegou:
      - se `lastOutboundAt == null` → criar/atualizar `firstResponseDueAt`
      - senão → criar/atualizar `nextResponseDueAt`
      - limpar `breachedAt` (se existia) ao receber inbound
  - `recordOutboundMessage(...)`:
    - limpar SLA pendente (ou recalcular para próximo follow-up, mas por ora **limpar**)
  - `close(...)` e `advanceStage(WON/LOST)`:
    - limpar SLA (SLA não existe em conversa finalizada)

## 2) Persistence: Prisma + Repository
### Prisma
- Expandir `Conversation` em `conversation.prisma` com colunas:
  - `firstResponseDueAt DateTime?`
  - `nextResponseDueAt DateTime?`
  - `slaBreachedAt DateTime?`
- Adicionar índice recomendado (para scheduler futuro):
  - `@@index([isActive, nextResponseDueAt])`
  - `@@index([isActive, firstResponseDueAt])`

### Repositórios
- Atualizar `PrismaConversationRepository` para mapear SLA ↔ entity.
- Manter compatibilidade com registros legados (valores null ok).

## 3) Application: FollowUpIntent (sem Scheduler)
- Criar `application/conversation/follow-up-intent.ts`
  - `conversationId`, `instanceId`, `type: TEXT|NONE`, `reason: SLA_BREACH|NO_RESPONSE`.
- Não criar dispatcher/scheduler agora.

## 4) Testes (critério de pronto)
- `Conversation.receiveInboundMessage()` cria firstResponse SLA quando não há outbound.
- `Conversation.recordOutboundMessage()` limpa SLA.
- `SLAEvaluator`:
  - OK antes do dueAt
  - DUE_SOON quando dentro da janela
  - BREACHED após dueAt
- Persistência: teste do `PrismaConversationRepository` (ou in-memory reconstitution) garantindo que SLA roundtrip não perde datas.

## 5) Validação
- `pnpm -w check-types`
- `pnpm test:ci`

## O que fica explicitamente fora (para não dispersar)
- FollowUpScheduler/cron (loop proativo)
- conteúdo dinâmico de follow-up
- UI/Inbox

## Resultado do Step 8 (ao final desta entrega)
- Toda conversa passa a ter SLA derivável e auditável.
- O sistema consegue afirmar determinística e consultavelmente: OK / DUE_SOON / BREACHED.
- O scheduler do Step 8.2 vira só “varrer conversas com dueAt e gerar FollowUpIntent”, sem inventar regra.
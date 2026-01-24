## O que está objetivamente resolvido
- Loop fechado com sinais observáveis + inferência por janela (sem BLOCK/REPORT fictício).
- Inferência vive no domínio (InstanceReputation), strategy/heater continuam burros.

## O único risco real em produção
- Janela sem persistência e sem garantia de completude de sinais (restart e/ou webhook faltando) pode gerar penalidade conservadora.

## Passo 8 — Adapter persistente (Prisma)
- **Schema Prisma** (packages/db):
  - Adicionar model `ReputationSignal` em [reputation.prisma](file:///d:/Projeto/WhatLead/packages/db/prisma/schema/reputation.prisma) com:
    - `id String @id @default(uuid())`
    - `instanceId String`
    - `occurredAt DateTime`
    - `type String`
    - `messageId String?`, `remoteJid String?`, `isGroup Boolean @default(false)`, `latencyMs Int?`
    - Índices: `@@index([instanceId, occurredAt])` e opcional `@@index([instanceId, type, occurredAt])`
    - `@@map("reputation_signal")`
- **Repo infra**:
  - Criar `PrismaReputationSignalRepository implements ReputationSignalRepository` em `apps/server/src/infra/signals/prisma-reputation-signal-repository.ts` usando `import prisma from "@WhatLead/db"`.
  - `append(signal)` → `prisma.reputationSignal.create(...)`
  - `getWindow({ instanceId, since, until })` → `findMany(where: { instanceId, occurredAt: { gte: since, lte: until } }, orderBy: { occurredAt: "asc" })`
- **TTL lógico (7 dias)**:
  - Implementar `deleteMany({ where: { occurredAt: { lt: cutoff }}})` via método `pruneOlderThan(cutoff)`.
  - Chamar esse prune de forma segura (ex.: no bootstrap 1x ao subir, ou num job simples diário). Sem heurística de decisão; apenas retenção.

## Passo 9 — Guardrails de qualidade de sinal (mínimos, sem “nova regra”)
- Ajustar `InstanceReputation.evaluateWindow(signals)` para evitar falsos positivos por falta de dados:
  - Se `messagesSent === 0` → não penalizar nem alertar.
  - Se `(messagesDelivered + deliveryFailures) === 0` e `messagesSent > 0` → **não** inferir `DELIVERY_DROP` nem `SEND_DELAY_SPIKE` (faltam evidências do lado “entrega”).
  - Se `observations < MIN_OBSERVATIONS` (ex.: 5) → não penalizar (apenas manter score).

## Passo 10 — Observabilidade (auditoria, não decisão)
- Expor no resultado do cérebro o que você quer auditar:
  - Estender `EvaluateInstanceHealthUseCaseResponse` para incluir:
    - `warmUpPhase` (derivada de `InstanceReputation.currentWarmUpPhase(now)`)
    - `cooldownReason` (de `reputation.cooldownReason`)
    - (opcional) `signalsSnapshot` (o snapshot usado na avaliação)
- Logar no nível application/infra (no handler/use case que chama o cérebro):
  - `deliveryRate`, `readRate`, `avgLatencyMs`, `cooldownReason`, `warmUpPhase`, `riskLevel`, `actions`.
  - Sem condicionar comportamento; só auditoria.

## Wiring (sem quebrar dev/CI)
- Adicionar um toggle simples por env (ex.: `SIGNAL_REPOSITORY=prisma|memory`, default `memory`), para:
  - CI/dev local continuarem funcionando sem Postgres.
  - Produção ativar `prisma` com `DATABASE_URL` real.
- No bootstrap [index.ts](file:///d:/Projeto/WhatLead/apps/server/src/index.ts), selecionar o repository conforme env e manter o resto do pipeline idêntico.

## Testes (regressão de produção)
- Unit do `PrismaReputationSignalRepository` com mock do `@WhatLead/db` (sem DB real).
- Teste de guardrails: janela sem delivered/failure não gera `DELIVERY_DROP`.
- Teste de observabilidade: response inclui `warmUpPhase`/`cooldownReason`.

## Validação
- Rodar `pnpm -w check-types` e `pnpm test:ci`.

## Resultado esperado
- Persistência real (restart não zera janela), consultas de janela eficientes e retenção controlada.
- Menos falsos positivos quando sinais estão incompletos.
- Auditoria clara em produção (sem introduzir regra em provider/heater/strategy).
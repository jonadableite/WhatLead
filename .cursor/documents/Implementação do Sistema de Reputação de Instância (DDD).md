Vou implementar o **Instance Reputation System** seguindo rigorosamente sua especificação de Domain-Driven Design (DDD).

### 1. Camada de Domínio (Server)
Criarei a estrutura de pastas e arquivos no `apps/server/src/domain`:

*   **Value Objects**
    *   `value-objects/instance-temperature-level.ts`: Definição dos níveis (COLD, WARM, HOT, etc.).
    *   `value-objects/temperature-trend.ts`: Definição das tendências (UP, DOWN, STABLE).
*   **Entidade**
    *   `entities/instance-reputation.ts`: A classe `InstanceReputation` contendo o estado (score, trend, cooldownCount) e comportamentos de proteção de invariantes (`increaseScore`, `enterCooldown`).
*   **Domain Services**
    *   `services/instance-temperature-mapper.ts`: Traduz o score numérico para nível de temperatura.
    *   `services/instance-reputation-evaluator.ts`: O "cérebro" que recebe sinais (feedback de disparos, interações) e calcula o novo estado da reputação.

### 2. Persistência (Database)
*   **Prisma Schema**: Adicionarei o model `InstanceReputation` no `packages/db/prisma/schema.prisma` para persistir o histórico e estado atual de cada instância.
*   **Migração**: Executarei o comando para atualizar o banco de dados.

### 3. Validação
*   Garantirei que o código esteja tipado estritamente (TypeScript Strict Mode).
*   Verificarei se a compilação do pacote `server` e `db` ocorre sem erros.

---
**Pergunta:** Posso prosseguir com a criação destes arquivos e a atualização do banco de dados?
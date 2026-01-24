Entendido perfeitamente. A correção conceitual é fundamental: **Temperatura é saída (estado derivado), não entrada.**

Vou implementar o **Passo 1** e **Passo 2** conforme seu roteiro, introduzindo os Repositories e o Use Case central.

### O Plano

1.  **Definir Interfaces de Repositório (Domain)**
    *   Criar `apps/server/src/domain/repositories/instance-reputation-repository.ts`: Para persistência da entidade `InstanceReputation`.
    *   Criar `apps/server/src/domain/repositories/instance-metric-repository.ts`: (Necessário) Para buscar os `ReputationSignals` (mensagens enviadas, bloqueios, etc.) que o Avaliador precisa. Sem isso, o Use Case não tem dados para passar ao Avaliador.

2.  **Criar o Use Case Central: `EvaluateInstanceReputationUseCase`**
    *   Local: `apps/server/src/domain/use-cases/evaluate-instance-reputation.ts`.
    *   Responsabilidade:
        1.  Busca a reputação atual (Repository).
        2.  Busca métricas/sinais recentes (MetricRepository).
        3.  Executa `InstanceReputationEvaluator.evaluate`.
        4.  Salva a nova reputação.
        5.  Retorna o `temperatureLevel` atualizado.

3.  **Refatorar `HeaterUseCase`**
    *   Local: `apps/server/src/domain/use-cases/heater.ts`.
    *   Mudança:
        *   Remover `temperature` do input `HeaterUseCaseRequest`.
        *   Injetar `EvaluateInstanceReputationUseCase` (ou os repositórios necessários).
        *   Fluxo: Avalia Reputação -> Obtém Temperatura -> Aplica Política -> Retorna Limites.

### Refatoração Técnica
*   Vou ajustar o `InstanceReputationEvaluator` para ser compatível com Injeção de Dependência (preparando para o futuro ML), removendo a rigidez estática se necessário, ou criando uma interface `ReputationEvaluator` que ele implementa.

Posso prosseguir com essa reestruturação?
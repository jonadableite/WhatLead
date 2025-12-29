# 📚 Regras do Projeto WhatLead

Este diretório contém as regras e diretrizes para agentes trabalharem no projeto WhatLead.

## 📖 Documentos Principais

### 🔴 OBRIGATÓRIO - Leia Primeiro

1. **`project-rules-enhanced.mdc`**
   - Regras completas e aprimoradas do projeto
   - Contexto do projeto, arquitetura, padrões, convenções
   - Diretrizes detalhadas para implementação
   - **DEVE ser consultado antes de qualquer implementação**

2. **`agent-verification-checklist.mdc`**
   - Checklist de verificação obrigatório
   - Sistema de validação antes de entregar código
   - **DEVE ser executado antes de considerar tarefa concluída**

### 🟡 IMPORTANTE - Consulte Quando Necessário

3. **`apis.mdc`**
   - Documentação central de todos os endpoints tRPC
   - **DEVE ser atualizado quando endpoints são criados/modificados**

4. **`database-schema.mdc`**
   - Esquema do banco de dados
   - Relacionamentos e fluxos críticos
   - **DEVE ser consultado para operações de banco**

5. **`expert-ddd.mdc`** (futuro)
   - Diretrizes para Especialista em DDD
   - Modelagem de domínios e regras de negócio

6. **`expert-software-engineer.mdc`** (futuro)
   - Diretrizes para Engenheiro de Software
   - Implementação e qualidade de código

7. **`expert-solution-architect.mdc`** (futuro)
   - Diretrizes para Arquiteto de Solução
   - Integração e coerência geral

8. **`expert-system-design.mdc`** (futuro)
   - Diretrizes para Especialista em System Design
   - Arquitetura escalável e distribuída

## 🎯 Fluxo Recomendado

1. **Antes de Começar**:
   - Leia `project-rules-enhanced.mdc` (seção relevante)
   - Consulte `apis.mdc` para entender endpoints existentes
   - Consulte `database-schema.mdc` para entender estrutura de dados
   - Identifique qual especialista é necessário

2. **Durante Implementação**:
   - Siga as diretrizes em `project-rules-enhanced.mdc`
   - Consulte `expert-*.mdc` conforme necessário
   - Mantenha `apis.mdc` atualizado

3. **Antes de Entregar**:
   - Execute `agent-verification-checklist.mdc` completamente
   - Valide todos os itens críticos
   - Só então considere a tarefa concluída

## 📋 Estrutura das Regras

### Contexto do Projeto
- O que é o WhatLead
- Públicos-alvo
- Domínios de negócio

### Arquitetura e Padrões
- Arquitetura em Camadas
- Princípios SOLID
- Clean Code

### Type Safety e Validação
- TypeScript Strict
- Validação em múltiplas camadas

### Estrutura do Projeto
- Monorepo
- Convenções de nomenclatura

### Stack Tecnológica
- Backend
- Frontend
- Infraestrutura

### Testes e Qualidade
- Critérios de cobertura
- Tipos de testes
- Gates de qualidade

### Segurança e Compliance
- Proteção Anti-Ban
- Segurança de dados
- Rate Limiting

### Observabilidade
- Logs estruturados
- Métricas
- Traces

### Workflow de Desenvolvimento
- Fluxo operacional
- Checklist antes de finalizar

### Convenções de Código
- TypeScript
- Node.js / Fastify
- React/Next.js

### Diretrizes para Agentes
- Compreensão de requisitos
- Implementação de código
- Testes
- Documentação

### Proibições Absolutas
- O que nunca fazer

### Sistema de Verificação
- Checklist obrigatório

## ⚠️ Importante

- **SEMPRE** consulte `project-rules-enhanced.mdc` antes de implementar
- **SEMPRE** execute o checklist antes de entregar
- **NUNCA** assuma comportamento sem verificar código
- **NUNCA** use `any` ou `var`
- **NUNCA** viole a Arquitetura em Camadas
- **NUNCA** ignore rate limits ou proteção anti-ban

## 🔄 Atualizações

Estas regras são atualizadas conforme o projeto evolui. Sempre consulte a versão mais recente antes de trabalhar.

**Última atualização**: 2025-01-15
**Versão**: 1.0.0 (WhatsApp Marketing SaaS)


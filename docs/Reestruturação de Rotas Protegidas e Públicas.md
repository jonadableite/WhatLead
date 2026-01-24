# Plano de Reestruturação de Navegação e Segurança (Frontend)

Este plano visa separar fisicamente as rotas públicas (autenticação) das rotas privadas (dashboard), implementando regras de navegação seguras e consistentes.

## 1. Estrutura de Diretórios (Arquitetura)
Vamos reorganizar `apps/web/src/app` para usar **Route Groups** do Next.js. Isso permite layouts distintos sem alterar a URL.

- **Atual:**
  - `(auth)/` (já existe: login, cadastro, etc.)
  - `dashboard/` (solto na raiz)
  - `organization/` (solto na raiz)
  - `admin/` (solto na raiz)
  - `ai/`, `todos/` (soltos na raiz)

- **Novo:**
  - `(auth)/` (Mantém rotas públicas de auth)
  - `(dashboard)/` (Novo grupo para rotas protegidas)
    - `dashboard/`
    - `organization/`
    - `admin/`
    - `ai/`
    - `todos/`
    - `layout.tsx` (Layout exclusivo para logados: Header, Sidebar, validação de sessão)

## 2. Implementação do Layout Protegido
Criaremos `apps/web/src/app/(dashboard)/layout.tsx`.
- **Função:** Fornecer a "casca" da aplicação (Header, Navegação) apenas para usuários logados.
- **Segurança:** Embora o Middleware proteja a rota, este layout serve como uma camada visual de reforço.

## 3. Middleware de Segurança (Revisão)
O arquivo `middleware.ts` atual já possui as regras corretas:
- **Protegidas:** `/dashboard`, `/admin`, `/organization`, `/todos`, `/ai`.
- **Públicas:** `/`, `/sign-in`, `/sign-up`, `/verify-email`, `/invite`, etc.
- **Comportamento:**
  - Não logado em rota protegida -> Redireciona para `/sign-in`.
  - Logado em rota de auth -> Redireciona para `/dashboard`.

*Nenhuma alteração lógica necessária no middleware, pois os caminhos de URL não mudam, apenas a localização dos arquivos.*

## 4. Passos de Execução
1.  **Criar pasta** `apps/web/src/app/(dashboard)`.
2.  **Mover pastas** `dashboard`, `admin`, `organization`, `ai`, `todos` para dentro de `(dashboard)`.
3.  **Criar** `apps/web/src/app/(dashboard)/layout.tsx` importando o `Header`.
4.  **Validar** se as importações relativas (`../../`) quebraram e corrigi-las se necessário.

## 5. Verificação de Segurança (Cybersecurity)
- **Defesa em Profundidade:**
  1.  **Middleware:** Bloqueia acesso não autorizado antes de renderizar.
  2.  **Server Components:** `DashboardPage` já verifica sessão (`authClient.getSession`).
  3.  **Estrutura:** Separação física evita vazamento de contexto.

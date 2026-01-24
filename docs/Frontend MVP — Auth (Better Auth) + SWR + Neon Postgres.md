## Diagnóstico rápido (estado real)

* O frontend já existe em `apps/web` com App Router e TypeScript.

* Auth já está integrado via Better Auth (`createAuthClient`) e páginas prontas em:

  * `(auth)/sign-in`, `(auth)/sign-up`

  * `/login` (wrapper com `SignInForm`/`SignUpForm`)

  * `middleware.ts` já protege rotas usando cookie `better-auth.session_token`.

* SWR ainda não está sendo usado (o app usa TanStack Query hoje).

* `DATABASE_URL` é variável **server-side** (packages/env/src/server.ts), então o Postgres/Neon deve ser configurado no backend, não no web.

## Observação de segurança (não negociável)

* A string do Postgres que você colou contém credenciais. Trate como vazada e **rotacione** a senha/usuário no Neon.

* Nunca colocar `DATABASE_URL` no `apps/web` nem em `NEXT_PUBLIC_*`.

## Objetivo imediato

* Entregar o “ponto de entrada” do produto: **Login + Criar conta** funcionando, com sessão por cookie httpOnly.

* Preparar o alicerce de consumo de API com **SWR** para as próximas telas do painel.

## Plano de execução (passo a passo)

### 1) Backend: conectar ao Postgres (Neon) corretamente

* Configurar `DATABASE_URL` no ambiente do **server** (`apps/server/.env` ou variáveis do deploy), sem commitar.

* Garantir que `BETTER_AUTH_URL` (server) e `NEXT_PUBLIC_SERVER_URL` (web) apontem para o mesmo host/base.

* Rodar migrações e geração do Prisma Client (db):

  * `prisma migrate`/`generate` (mantendo o schema em `packages/db/prisma/schema`).

### 2) Frontend: padronizar rotas de Auth (uma narrativa, dois caminhos)

* Escolher o “canonical path”:

  * opção A: manter `/login` como entrada única (recomendado)

  * opção B: usar `(auth)/sign-in` e `(auth)/sign-up` e fazer `/login` redirecionar

* Ajustar UX mínima:

  * manter `redirect` query param (middleware já injeta)

  * estados: loading, erro, sucesso

### 3) Better Auth no web: sessão e redirecionamentos

* Confirmar fluxo:

  * `signIn.email({ callbackURL })` e `signUp.email({ callbackURL })` já existem

  * após sucesso: `router.replace(redirect||/dashboard)`

* Consolidar um helper de navegação de pós-auth para não duplicar em páginas/formulários.

### 4) Introduzir SWR (base para painel)

* Adicionar dependência `swr` no `apps/web`.

* Criar uma camada única de fetch:

  * `lib/api/fetcher.ts` com `credentials: "include"` e parsing de erro

  * `lib/api/hooks.ts` com hooks SWR (ex.: `useMe`, `useTenant`, `useInstances`)

* Importante: não substituir o Better Auth client; usar SWR para APIs do produto/console.

### 5) Endpoint “me”/“tenant” (contrato mínimo)

* Verificar se o backend já expõe `GET /api/auth/me` (ou equivalente) e `GET /api/tenants/me`.

* Se não existir, criar endpoints mínimos (server) para:

  * retornar sessão/usuário atual

  * retornar tenant ativo + plano/limites

  * geralmente e fornecido pelo better-auth precisa verificar no better-auth isso primeiro

### 6) Testes mínimos (para garantir regressão zero)

* Unit (web): teste de renderização dos formulários + tratamento de erro.

* E2E (opcional agora): fluxo Login → redirect.

* usar o vitetest 

## Resultado do ciclo

* Login e Criar conta funcionando de ponta a ponta com Better Auth.

* SWR pronto como “motor de leitura” para o painel instrumental.

* Banco Neon configurado apenas no backend, com migrações/generate operacionais.


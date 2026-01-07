# AGENTS.md - WhatLead Codebase Guide

This document provides essential information for AI agents working in the WhatLead codebase.

## Project Overview

WhatLead is a SaaS WhatsApp Marketing platform built as a TypeScript monorepo using pnpm workspaces and Turborepo.

**Tech Stack:** Next.js 16+ (App Router), React 19+, TailwindCSS v4, shadcn/ui, Fastify 5+, tRPC, Better Auth, PostgreSQL with Prisma ORM, pnpm@10.18.2, ESM modules.

## Build/Lint/Test Commands

```bash
pnpm dev                    # Start all apps in dev mode
pnpm dev:web                # Start only web app (Next.js on port 3001)
pnpm dev:server             # Start only server (Fastify API)
pnpm build                  # Build all apps via Turborepo
pnpm check-types            # TypeScript type checking across all packages
pnpm check                  # Lint and format all files with Biome (auto-fix)

# Database (Prisma)
pnpm db:push                # Push schema changes to database
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run database migrations
pnpm db:studio              # Open Prisma Studio GUI

# Run specific workspace
pnpm turbo -F <workspace> <command>   # e.g., pnpm turbo -F web build
```

**Note:** Test framework is not yet configured.

## Project Structure

```
WhatLead/
├── apps/
│   ├── web/              # Next.js frontend (src/app/, components/, lib/, utils/)
│   └── server/           # Fastify API Gateway (tRPC endpoints, auth routes)
├── packages/
│   ├── api/              # @WhatLead/api - Shared tRPC routers
│   ├── auth/             # @WhatLead/auth - Better Auth config
│   ├── db/               # @WhatLead/db - Prisma client & schema
│   ├── env/              # @WhatLead/env - Environment validation
│   └── config/           # @WhatLead/config - Shared TypeScript config
└── .cursor/rules/        # Cursor AI rules
```

## Code Style Guidelines

### TypeScript Strict Mode (MANDATORY)

- **NEVER** use `any` - use `unknown` when type is truly unknown
- **NEVER** use `var` - use `const` or `let`
- **ALWAYS** use interfaces over type aliases (unless union/intersection needed)
- **ALWAYS** type function returns explicitly
- **ALWAYS** use arrow functions and async/await for Promises

### Import Order

```typescript
// 1. Type-only imports first (verbatimModuleSyntax)
import type { AppRouter } from "@WhatLead/api/routers/index";

// 2. External dependencies
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// 3. Workspace packages
import prisma from "@WhatLead/db";
import { env } from "@WhatLead/env/server";

// 4. Relative imports
import { publicProcedure, router } from "../index";
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes/Interfaces | PascalCase | `WhatsAppService`, `SendMessageParams` |
| Functions/Variables | camelCase | `sendMessage`, `createCampaign` |
| Files/Directories | kebab-case | `auth-client.ts`, `todo.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| Functions | Must be verbs | `sendMessage` (correct) vs `messageSender` (wrong) |

### Formatting (Biome)

- **Indentation:** Tabs
- **Quotes:** Double quotes
- **Self-closing elements:** Required for empty JSX
- **Sorted Tailwind classes:** Auto-sorted via `cn()`, `clsx()`, `cva()`

### tRPC Procedures Pattern

```typescript
import { TRPCError } from "@trpc/server";
import prisma from "@WhatLead/db";
import z from "zod";
import { publicProcedure, router } from "../index";

export const exampleRouter = router({
  getAll: publicProcedure.query(async () => {
    return await prisma.example.findMany({ orderBy: { id: "asc" } });
  }),
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await prisma.example.create({ data: { name: input.name } });
    }),
});
```

### Error Handling

```typescript
// tRPC errors - throw TRPCError with appropriate code
try {
  return await prisma.todo.update({ where: { id }, data });
} catch (error) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
}

// Fastify errors - log and return structured response
fastify.log.error({ err: error }, "Operation failed:");
reply.status(500).send({ error: "Internal error", code: "OPERATION_FAILED" });
```

### Environment Variables

All environment variables MUST be validated via `@WhatLead/env`:
```typescript
import { env } from "@WhatLead/env/server";  // Server-side
import { env } from "@WhatLead/env/web";     // Client-side (Next.js)
```

### Export Patterns

- Named exports (ALWAYS - no default exports except React components)
- Default export ONLY for: React page/layout components, Prisma client

## Cursor Rules

This project has Cursor rules in `.cursor/rules/`. Key files:
- `project-rules-enhanced.mdc` - Main comprehensive rules
- `agent-verification-checklist.mdc` - Mandatory checklist before delivering code

### Critical Rules Summary

**Absolute Prohibitions:**
- Never use `any` or `var`
- Never skip input validation (always use Zod in tRPC)
- Never expose secrets in code
- Never violate layered architecture (Frontend -> Backend -> Business Logic -> Database)

**Required Patterns:**
- Always validate inputs with Zod schemas
- Always use early returns (avoid nested if/else)
- Keep functions small (< 50 lines, preferably < 30)

### Verification Checklist (Before Delivery)

1. No `any` or `var` usage
2. All inputs validated with Zod
3. Type-check passing (`pnpm check-types`)
4. Lint passing (`pnpm check`)
5. Build successful (`pnpm build`)
6. Error handling implemented

## Workspace Packages

| Package | Import Path | Purpose |
|---------|-------------|---------|
| `@WhatLead/api` | `@WhatLead/api/...` | tRPC routers, procedures, context |
| `@WhatLead/auth` | `@WhatLead/auth` | Better Auth configuration |
| `@WhatLead/db` | `@WhatLead/db` | Prisma client (default export) |
| `@WhatLead/env` | `@WhatLead/env/server` or `/web` | Environment validation |
| `@WhatLead/config` | - | Shared TypeScript config (extends) |

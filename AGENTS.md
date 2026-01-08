# AGENTS.md - WhatLead Codebase Guide

This document provides essential information for AI agents working in the WhatLead codebase.

## Project Overview

WhatLead is a SaaS WhatsApp Marketing platform built as a TypeScript monorepo using pnpm workspaces and Turborepo.

**Tech Stack:** Next.js 16+ (App Router), React 19+, TailwindCSS v4, shadcn/ui, Fastify 5+, tRPC, Better Auth, PostgreSQL with Prisma ORM, Pino logging, pnpm@10.18.2, ESM modules.

## Build/Lint/Test Commands

```bash
# Development
pnpm dev                    # Start all apps in dev mode
pnpm dev:web                # Start only web app (Next.js on port 3001)
pnpm dev:server             # Start only server (Fastify API)

# Build & Quality
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

**Testing:** Framework not configured. Use `pnpm check-types && pnpm check && pnpm build` for validation.

## Logging System (Pino + Pino-Pretty) 🎨✨

**Beautiful, colorful, structured logging with emojis, traceId correlation, and maximum terminal UI/UX**

**Beautiful, structured logging with traceId correlation and business event tracking.**

```bash
# View colorful logs in development
pnpm dev:server  # Server logs with Pino-Pretty
pnpm dev:web     # Frontend logs in browser console

# Production logs are JSON structured for log aggregation
```

### Logger Usage

```typescript
// Server-side logging (@WhatLead/logger)
import { logger, businessLogger, perfLogger, createRequestLogger } from "@WhatLead/logger";

// Basic logging
logger.info("User logged in", { userId: "123" });
logger.error("Database error", { err: error });

// Business events
businessLogger.userLoggedIn("user123");
businessLogger.campaignCreated("camp456", "user123", "Summer Sale");

// Performance monitoring
const timer = perfLogger.startTimer("api_call");
try {
  // ... operation
  timer.end();
} catch (error) {
  timer.fail(error);
}

// Request-scoped logging
const requestLogger = createRequestLogger();
requestLogger.info("Processing payment", { amount: 100 });

// Frontend logging (@/lib/logger)
import { logger } from "@/lib/logger";
logger.business("user_action", "Button clicked", { buttonId: "submit" });
logger.performance("form_submit", 150); // 150ms
```

### Log Features ✨

- **🎨 Maximum Terminal UI/UX**: Beautiful colors, emojis, and structured display
- **🔗 TraceId Correlation**: Automatic request tracing with visual correlation
- **🐌 Smart Slow Detection**: Database queries >100ms and operations >1s highlighted
- **📊 Production JSON**: Structured JSON logs ready for log aggregation
- **🎯 Rich Business Events**: Dedicated logging with contextual emojis for all operations
- **⏱️ Performance Monitoring**: Real-time timing with visual indicators
- **🛡️ Enhanced Error Context**: Full stack traces with request correlation
- **🌐 HTTP Request Visualization**: Beautiful request/response logging with status indicators
- **🎭 Event-Based Icons**: Different emojis for different types of events
- **📋 Structured Fields**: Pino-Pretty displays custom fields beautifully

### Log Levels & Visual Indicators

| Level | Color | Emoji | Usage |
|-------|-------|-------|--------|
| TRACE | Gray | 📋 | Detailed debugging |
| DEBUG | Magenta | 🐛 | Development debugging |
| INFO | **Cyan** | ℹ️ | General information |
| WARN | **Yellow** | ⚠️ | Warnings |
| ERROR | **Red** | ❌ | Errors |
| FATAL | **Red** | 🚨 | Critical errors |

### Beautiful Log Examples 🎨

```bash
# Server Startup
2024-01-07 15:30:45 INFO  🚀 server_start WhatLead API server started successfully port=3000 host=0.0.0.0 environment=development

# HTTP Requests
2024-01-07 15:30:46 INFO  🌐 request Incoming request method=GET url=/api/todos traceId=abc123 userAgent="Mozilla/5.0..."
2024-01-07 15:30:46 INFO  📤 response Request completed method=GET url=/api/todos statusCode=200 responseTime=45.2 traceId=abc123

# Business Events
2024-01-07 15:30:47 INFO  🎉 user_register User registered successfully userId=user123 email=user@example.com
2024-01-07 15:30:48 INFO  📢 campaign_create Campaign created successfully campaignId=camp456 userId=user123 name="Summer Sale"
2024-01-07 15:30:49 INFO  💳 payment_process Payment processed successfully paymentId=pay789 userId=user123 amount=99.99 currency=USD

# Performance & Errors
2024-01-07 15:30:50 WARN  🐌 db_slow_query 🐌 Slow database query detected (250ms) duration=250 query="SELECT * FROM todos..."
2024-01-07 15:30:51 ERROR 💥 error 💥 tRPC Error: Todo not found code=NOT_FOUND path=todo.getAll traceId=abc123 userId=user123
```

### Business Event Types & Icons 🎭

| Event Type | Icon | Description |
|------------|------|-------------|
| **Authentication** | 🔐🔓🎉✅ | Login, logout, registration, verification |
| **Business Logic** | 📢📤💳 | Campaigns, messages, payments |
| **System Events** | 🚀🛑💥 | Server lifecycle, errors |
| **HTTP Traffic** | 🌐📤❌ | Requests, responses, errors |
| **Database** | 🗄️🐌 | Queries, slow queries |
| **Performance** | ⏱️🐌 | Timings, slow operations |

### Request Correlation

Every request gets a unique `traceId` that follows through:
- HTTP request logging
- tRPC procedure calls
- Database queries
- Business events
- Error logs

**Header:** `X-Trace-Id` or `X-Request-Id` for external correlation.

## Code Style Guidelines

### TypeScript & Naming

- **Strict mode:** No `any`/`var`, explicit return types, arrow functions + async/await
- **Interfaces** over type aliases (except unions/intersections)
- **Naming:** PascalCase (classes/interfaces), camelCase (functions/vars), kebab-case (files), UPPER_SNAKE_CASE (constants)
- **Functions:** Must be verbs (`sendMessage`, not `messageSender`)

### Formatting (Biome)

- **Indentation:** Tabs, **Quotes:** Double, **Self-closing JSX:** Required
- **Tailwind classes:** Auto-sorted via `cn()`, `clsx()`, `cva()`

### tRPC Pattern

```typescript
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

**tRPC Procedures:**
```typescript
try {
  return await prisma.item.update({ where: { id: input.id }, data: input.data });
} catch (error) {
  if (error.code === 'P2025') {
    throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operation failed" });
}
```

**React Components:**
```typescript
const handleSubmit = async (data: FormData) => {
  try {
    await api.example.create.mutate(data);
    toast.success("Success!");
  } catch (error) {
    toast.error(error.message || "Failed");
  }
}
```

### React Component Patterns

```typescript
// Client components require "use client" directive
"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

// @tanstack/react-form + Zod validation pattern
export default function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      const result = await authClient.signIn.email(value);
      if (result.success) {
        toast.success("Login successful!");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <form.Field name="email">
        {(field) => (
          <div>
            <input {...field.getInputProps()} />
            {field.state.meta.errors.map((error) => (
              <p key={error.message} className="text-red-500">{error.message}</p>
            ))}
          </div>
        )}
      </form.Field>
    </form>
  );
}

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}
```

### Environment Variables

All environment variables MUST be validated via `@WhatLead/env`:
```typescript
import { env } from "@WhatLead/env/server";  // Server-side
import { env } from "@WhatLead/env/web";     // Client-side (Next.js)
```

### Export Patterns

- **Named exports** (ALWAYS - preferred for utilities, hooks, types)
- **Default exports** ONLY for: React page/layout components, Prisma client
- **Barrel exports** for clean API surfaces: `export * from "./components"`
- **Type exports** alongside value exports: `export type { User } from "./types"`



## Code Review Checklist

**MANDATORY Commands (run before committing):**
1. `pnpm check-types` - TypeScript validation
2. `pnpm check` - Lint/format with Biome
3. `pnpm build` - Build verification

**Requirements:**
- ✅ No `any`/`var` (use `unknown` for unknowns)
- ✅ Zod validation on all inputs
- ✅ Functions < 50 lines (< 30 preferred)
- ✅ Early returns (avoid nested if/else)
- ✅ TRPCError for API errors, toast for UI
- ✅ `@WhatLead/env` for environment variables
- ✅ No secrets in code/logs
- ✅ Layered architecture: Frontend → API → Database

**Note:** Cursor rules and Copilot instructions not configured.

## Workspace Packages

| Package | Purpose |
|---------|---------|
| `@WhatLead/api` | tRPC routers, procedures, context |
| `@WhatLead/auth` | Better Auth configuration |
| `@WhatLead/db` | Prisma client & schema |
| `@WhatLead/env` | Environment validation (`/server`, `/web`) |
| `@WhatLead/logger` | Pino logging system with traceId correlation |
| `@WhatLead/config` | Shared TypeScript config |


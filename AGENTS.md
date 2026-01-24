# AGENTS.md — WhatLead Codebase Guide (Advanced / Optimized)

> This document defines **how AI agents and engineers must operate** inside the WhatLead codebase.
> It is mandatory reading before modifying **domain, reputation, heater, campaign, instance, or dispatch logic**.

This guide enforces **DDD + Clean Architecture + SOLID + Type Safety**, aligned with the business goal of WhatLead:
**maximize WhatsApp deliverability while minimizing ban risk through intelligent reputation management.**

---

## 1. Project Overview

WhatLead is a **WhatsApp Marketing SaaS** designed to operate at scale while behaving as close to **human-like interaction** as possible.

### Core Goals
- Prevent bans and rate-limits
- Continuously evaluate instance health and reputation
- Dynamically adapt dispatch behavior
- Learn from real usage patterns (future ML integration)

### Tech Stack
- TypeScript (strict)
- Fastify 5+
- tRPC
- Next.js 16+ (App Router)
- React 19+
- TailwindCSS v4
- Prisma + PostgreSQL
- pnpm workspaces + Turborepo
- Biome (lint/format)
- ESM modules only

---

## 2. Architectural Principles (Non-Negotiable)

### Clean Architecture
API / Controllers
↓
Use Cases
↓
Domain (Entities, Policies, Services)
↓
Repository Interfaces
↓
Infrastructure (Prisma, DB, Queues, Providers)

### Golden Rules
- Domain **never** depends on infrastructure
- Infrastructure **always** depends on domain
- No business logic inside controllers, routes, or adapters
- No ORM types inside domain

---

## 3. Folder Structure (Relevant)

apps/server/src
├── domain
│ ├── entities
│ ├── value-objects
│ ├── policies
│ ├── services
│ ├── repositories # INTERFACES ONLY
│ └── use-cases
├── application # composition roots / DI
└── infra
├── repositories # Prisma adapters
├── providers
└── events

---

## 3.1 UI/UX & Frontend Standards (New)

> **Mandatory Reading**: [UI_UX.md](./UI_UX.md)
> All frontend work must adhere to the **Premium SaaS Design System**.

### Key Rules
- **Mobile-First**: If it doesn't work on mobile, the PR is rejected.
- **Strict Tokens**: Use `bg-card`, `text-muted-foreground`, etc. No magic hex codes.
- **Component Classes**: Use `.btn-primary`, `.input-premium`, `.card-hover` defined in `index.css`.
- **Motion**: UI must feel alive. Use `.animate-fade-in` and `.stagger-*` utilities.

---

## 4. Mandatory TypeScript Rules

- `strict: true`
- **NEVER** use `any`
- Use `unknown` + validation when required
- Always type function returns
- Prefer `interface` over `type` (except unions)
- No `var`
- No implicit `any`
- Arrow functions preferred
- Async/await only (no `.then()` chains)

---

## 5. Domain Rules (CRITICAL)

### Entities
- Must enforce invariants
- Can mutate internal state
- Cannot call repositories
- Cannot know about Prisma or HTTP

### Value Objects
- Immutable
- Self-validating
- Comparable

### Use Cases
- Orchestrate domain logic
- Call repositories
- Coordinate services and policies
- No HTTP, no DB logic

### Policies
- Pure functions
- Deterministic rules
- No side effects

---

## 6. Repository Pattern (Mandatory)

Repositories are **contracts**, not implementations.

### Interface Example

```ts
// domain/repositories/instance-reputation-repository.ts
import type { InstanceReputation } from "../entities/instance-reputation";

export interface InstanceReputationRepository {
  findByInstanceId(instanceId: string): Promise<InstanceReputation | null>;
  create(reputation: InstanceReputation): Promise<void>;
  save(reputation: InstanceReputation): Promise<void>;
}
```

Rules
No findAll without strong justification

No leaking ORM models

Mapping happens in infra layer only

7. Use Case Pattern (Standard)
EvaluateInstanceReputationUseCase
```ts
interface EvaluateInstanceReputationRequest {
  companyId: string;
  instanceId: string;
}

interface EvaluateInstanceReputationResponse {
  score: number;
  temperature: InstanceTemperatureLevel;
  trend: "UP" | "DOWN" | "STABLE";
  alerts: string[];
}
```

Responsibilities
Load reputation

Collect signals

Evaluate health

Persist new state

Return actionable output

8. Heater System Rules
Core Principle
Temperature is NEVER an input.
It is always derived from reputation.

Heater Flow
Evaluate instance reputation

Map reputation → temperature level

Apply heating policy

Return safe limits

Heater Output
maxMessagesPerHour

maxMessagesPerDay

minDelayBetweenMessages

recommendedBatchSize

warnings / alerts

9. Instance Reputation Model
Reputation is calculated from signals, never assumptions.

Signals Examples
Reply rate

Block rate

Message delivery failures

Human interaction ratio

Group participation

Media vs text balance

Conversation reciprocity

Time-of-day consistency

Reputation Trends
UP: healthy interaction

STABLE: safe but stagnant

DOWN: increasing risk

10. Event Instrumentation (Required)
All behavior must be observable.

Mandatory Events
message.sent

message.delivered

message.read

message.replied

message.blocked

instance.warmed

instance.cooled

campaign.dispatched

Event Rules
JSON only

ISO timestamps

No PII

Use IDs, hashes, or references

11. Machine Learning Strategy (Future-Proof)
ML is an Adapter, Not Core Logic
Default evaluator: rule-based

ML evaluator: optional, replaceable

Fallback always exists

ML Guidelines
Offline training only

Anonymized data

Feature-based (never raw messages)

Versioned models

A/B testing mandatory

Canary rollout required

Evaluator Interface
```ts
export interface ReputationEvaluator {
  evaluate(features: FeatureVector): Promise<EvaluationResult>;
}
```

12. Tests (Mandatory)
Required Coverage
Domain services

Reputation evaluation

Heater policy limits

Repository adapters

Rules
No untested business rules

Tests live next to source (*.spec.ts)

Use in-memory DB for integration tests

13. Error Handling
Domain
Use domain errors

Never throw HTTP errors

API / tRPC
Always throw TRPCError

Never expose internal messages

14. Naming Conventions
Element	Convention
Classes	PascalCase
Interfaces	PascalCase
Methods	camelCase (verbs)
Files	kebab-case
Constants	UPPER_SNAKE_CASE

15. Forbidden Practices
Business logic inside routes/controllers

ORM types in domain

Accepting user-defined temperature

Hardcoded limits

Silent failures

Logging sensitive data

Massive PRs without design docs

16. PR & Commit Rules
Commit Message
```
feat(reputation): evaluate instance health based on replies
```

PR Requirements
Small, focused

Clear description

Architectural rationale

Tests included

No breaking changes without approval

17. Pre-Merge Checklist
 No any

 Domain clean

 Interfaces respected

 Tests passing

 Type-check passing

 Lint passing

 Events instrumented

 Docs updated if needed

18. Final Principle
If the system behaves like a human, the platform survives.
If it behaves like a bot, it will be banned.

Everything in WhatLead exists to enforce this rule.

---

## 19. Agent vs Operator Protocols 🤖👤

To maintain strict governance over "Who did what", we distinguish between AI and Humans.

### Terminology
- **Operator (👤)**: A human user interacting via the UI.
- **Agent (🤖)**: An AI system acting autonomously or semi-autonomously.

### Rules of Engagement
1.  **Identity Separation**: Every action must be traceable to either an `agentId` or `userId`.
2.  **Dispatch Gate**: Neither Agents nor Operators can bypass the `DispatchGateUseCase`. All messages are subject to reputation checks.
3.  **Agent Visibility**: When an Agent takes an action (e.g., replies to a lead), the UI must clearly indicate "AI" or the Agent's Name.
4.  **Operator Override**: Human actions always take precedence over Agent intents. If a human intervenes, the Agent must pause or yield.

---

🧭 Skill Set Summary (Recommended for WhatLead)
Core (Must-have)

ddd-domain-architect

clean-architecture-enforcer

solid-typescript-engineer

integration-provider-architect

saas-ui-architect (New)

Strategic (Highly recommended)

event-normalization-specialist

use-case-orchestrator

ml-ready-domain-designer

SaaS UI System Designer (New)

Mobile-First Responsive UX (New)

Optional (Quality at scale)

safe-refactor-guardian

Accessibility & Usability Compliance (New)

## Logging System (Pino + Pino-Pretty) 🎨✨

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

---

## Workspace Packages

| Package | Purpose |
|---------|---------|
| `@WhatLead/api` | tRPC routers, procedures, context |
| `@WhatLead/auth` | Better Auth configuration |
| `@WhatLead/db` | Prisma client & schema |
| `@WhatLead/env` | Environment validation (`/server`, `/web`) |
| `@WhatLead/logger` | Pino logging system with traceId correlation |
| `@WhatLead/config` | Shared TypeScript config |

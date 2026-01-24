I will create a comprehensive `UI_UX.md` guide and update `AGENTS.md` to enforce premium design standards and stricter agent rules.

### 1. Create `d:\Projeto\WhatLead\UI_UX.md` (New "Bible" for Frontend)
This file will document the **Premium SaaS Design System** found in `apps/web/src/index.css`.
- **Core Principles:** Mobile-First, Dark Mode by Default, Motion-Driven.
- **Design Tokens:** Documenting the `base-lyra` theme (Colors, Spacing, Radius).
- **Component Classes:** Explicit usage rules for `.btn-primary`, `.card-hover`, `.glass`, `.input-premium`.
- **Effects & Animation:** Guide for `shine-border`, `border-beam`, and `stagger-*` animations.
- **Layout:** Standardizing `.container-responsive` and `safe-area` usage.

### 2. Update `d:\Projeto\WhatLead\AGENTS.md`
I will enrich the agent rules to be stricter and more aligned with the "Agent vs Operator" terminology.
- **New Section: 🎨 UI/UX & Frontend Rules**
  - Mandate usage of `UI_UX.md`.
  - Ban "magic values" in CSS (enforce tokens).
  - Enforce Mobile-First responsiveness for all new screens.
- **Refined Section: 🤖 Agent vs Operator Protocols**
  - **Agent (AI):** Generates intents based on logic/goals.
  - **Operator (Human):** Generates intents based on UI actions.
  - **Rule:** Both must pass through `DispatchGateUseCase`.
- **Skill Set Update:** Add `SaaS UI System Designer` and `Mobile-First Responsive UX` to the recommended skills.

### 3. Verification
- I will verify the file creation and content consistency.
- I will ensure `AGENTS.md` correctly links to the new documentation.

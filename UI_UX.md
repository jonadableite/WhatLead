# UI_UX.md — WhatLead Design System & Frontend Guide

> This document is the **single source of truth** for all UI/UX decisions in WhatLead.
> All frontend agents and engineers must adhere to these guidelines to maintain a **Premium SaaS (Fintech-grade)** aesthetic.

---

## 1. Core Design Philosophy

WhatLead aims for a **"Dark Mode Premium"** aesthetic similar to high-end developer tools (e.g., Vercel, Linear, Raycast) or modern fintech apps.

### Key Principles
1.  **Mobile-First Always**: Every component must work on a 320px width screen. No exceptions.
2.  **Dark Mode Native**: The app is designed for dark mode first. Light mode is a secondary consideration.
3.  **Motion-Driven**: Use subtle, purposeful animations to guide the user (e.g., `fade-in`, `slide-up`).
4.  **Composition Over Inheritance**: Build complex UIs by composing small, atomic primitives.
5.  **Data Density**: Balance high information density (dashboard) with touch-friendly targets (mobile).

---

## 2. Tech Stack & Setup

- **Framework**: Next.js 16+ (App Router)
- **Library**: React 19+
- **Styling**: TailwindCSS v4
- **Components**: Shadcn/Radix Primitives
- **Icons**: Lucide React
- **Theme Source**: `apps/web/src/index.css` (Do not edit this unless authorized)

---

## 3. Design Tokens (Tailwind v4)

Use these semantic tokens instead of raw colors.

### Colors (Base Lyra Theme)

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `bg-background` | `--background` | Main page background (Deep dark: `#0a0a0f`) |
| `bg-card` | `--card` | Elevated surfaces (panels, cards) |
| `bg-primary` | `--primary` | **Brand Actions** (Buttons, active states) |
| `text-primary` | `--primary` | Primary highlights |
| `text-muted-foreground` | `--muted-foreground` | Secondary text, labels, descriptions |
| `bg-destructive` | `--destructive` | Delete actions, critical errors |
| `bg-accent` | `--accent` | Hover states, subtle highlights |
| `border-border` | `--border` | Subtle dividers and card borders |

### Spacing Scale
- Base unit: **4px** (`0.25rem`)
- `p-4` = 16px (Standard padding)
- `gap-2` = 8px (Tight grouping)
- `gap-6` = 24px (Section separation)

### Radius
- `rounded-lg`: Standard for cards and inputs.
- `rounded-full`: Buttons and badges.

---

## 4. Component Classes (The "Premium" Set)

These utility classes are defined in `index.css` to enforce consistency. **Use them.**

### Buttons
```tsx
// Primary Action
<button className="btn-primary">Create Campaign</button>

// Secondary / Cancel
<button className="btn-secondary">Cancel</button>

// Subtle / Ghost
<button className="btn-ghost">Settings</button>

// Outline
<button className="btn-outline">View Details</button>
```

### Cards & Surfaces
```tsx
// Standard Card with Hover Effect
<div className="bg-card border border-border rounded-lg p-6 card-hover">
  <h3>Card Title</h3>
</div>

// Glassmorphism (Use sparingly, e.g., sticky headers)
<div className="glass sticky top-0 z-50">
  ...
</div>
```

### Inputs
```tsx
// Premium Input Field
<input className="input-premium" placeholder="Enter your email..." />
```

### Badges
```tsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Blocked</span>
```

---

## 5. Effects & Animation 🎭

We use `tailwindcss-animate` and custom keyframes.

### Entry Animations
Stagger these for lists or dashboard grids.
- `.animate-fade-in`
- `.animate-slide-up`
- `.animate-scale-in`

**Usage Example:**
```tsx
<div className="flex flex-col gap-4">
  {items.map((item, i) => (
    <div key={item.id} className={`animate-slide-up stagger-${Math.min(i + 1, 8)}`}>
      {item.name}
    </div>
  ))}
</div>
```

### Premium Visual Effects
- **Shine Border**: Use for high-value items (plans, AI features).
  ```tsx
  <div className="shine-border">...</div>
  ```
- **Border Beam**: Use for loading states or active processing.
  ```tsx
  <div className="border-beam">...</div>
  ```
- **Glow**:
  ```tsx
  <div className="glow-md hover-glow">...</div>
  ```

---

## 6. Layout & Responsiveness 📱

### The Container
Use `.container-responsive` instead of `container mx-auto`. It handles max-widths per breakpoint automatically.

```tsx
<main className="container-responsive py-8 safe-area">
  ...
</main>
```

### Mobile Safety
Always respect the "Safe Area" on modern phones (notched devices).
- Use `.safe-area` utility.
- Or specific: `.safe-bottom` for fixed footers.

### Touch Targets
Ensure all clickable elements are at least **44x44px** on mobile.
- Use `.tap-target` utility if needed.

---

## 7. Dashboard Layout Patterns

### 1. The "Stats Row"
Top of dashboard. 2-4 cards. Scrollable on mobile.
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard /> ...
</div>
```

### 2. The "Data Table"
- **Desktop**: Full table with columns.
- **Mobile**: Stacked cards (Do not scroll horizontally unless necessary).
  - *Pattern*: Hide less important columns on mobile, or switch to a "Card View".

### 3. The "Action Bar"
- **Desktop**: Top right buttons.
- **Mobile**: Floating Action Button (FAB) or Bottom Sheet.

---

## 8. Accessibility (Non-Negotiable)

1.  **Contrast**: Text must satisfy WCAG AA against background.
2.  **Focus**: Never remove `outline` without providing a custom `:focus-visible` style (Tailwind's `outline-ring` is default).
3.  **Semantic HTML**: Use `<button>`, not `<div onClick>`.
4.  **Labels**: All inputs need labels or `aria-label`.

---

## 9. Common Mistakes to Avoid ❌

- **DO NOT** use arbitrary values (e.g., `w-[357px]`). Use grid or percentages.
- **DO NOT** hardcode colors (e.g., `bg-[#123456]`). Use tokens (`bg-card`).
- **DO NOT** ignore empty states. Always design for "0 data".
- **DO NOT** ignore loading states. Use `<Skeleton />` or `.shimmer`.

---

## 10. Recommended Agents/Skills

When working on frontend tasks, invoke:
- `saas-ui-architect`
- `SaaS UI System Designer`
- `Mobile-First Responsive UX`
- `Accessibility & Usability Compliance`

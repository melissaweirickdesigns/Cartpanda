# Upsell Funnel Builder

A **visual-only** upsell funnel builder built with **Next.js (App Router)** + **React Flow**.

- Drag node types from the left **Palette** onto the canvas
- Move nodes, connect them with **directional edges**
- Funnel state **persists to localStorage**
- **Export** / **Import** the funnel as JSON

## Live Demo / Repo

- Live demo: https://cartpanda.onrender.com/
- Repo: https://github.com/melissaweirickdesigns/Cartpanda

---

## How to run locally

### Requirements

- Node.js **20.9+**
- npm (or pnpm/yarn)

### Install & run

```bash
npm install
npm run dev
```

Then open: http://localhost:3000

### Other scripts

```bash
npm run build
npm run start
npm run lint
```

---

## Features

### Core interactions

- **Drag & drop node creation** from the Palette (Sales, Order, Upsell, Downsell, Thank You)
- **Draggable nodes** on a pannable canvas (pan on scroll)
- **Connect nodes** with directional arrows (smoothstep edges + arrow marker)
- **Selection + deletion**
  - Click to select nodes/edges
  - Press **Delete** / **Backspace** to remove selected nodes/edges
- **Undo / Redo**
  - **Undo:** Ctrl/Cmd + Z
  - **Redo:** Ctrl/Cmd + Shift + Z

### Validation rules

Validation is intentionally *visual* (warnings) except for one hard rule:

- **Thank You** nodes: **no outgoing edges** (blocked at connection time)
- **Sales Page** nodes: should have **exactly 1 outgoing** edge (warning if not)
- **Orphan nodes** (no incoming + no outgoing): warning (bonus)

Warnings show in two places:

- A **red outline** on the node
- A **Validation** panel on the right listing the messages

### Persistence + import/export

- Auto-saves to `localStorage` under the key `cp_funnel_builder_v1`
- **Export JSON** downloads a `funnel.json` file
- **Import JSON** loads a previously exported file

The exported shape is versioned:

```ts
type FunnelExport = {
  version: 1;
  nodes: Node<FunnelNodeData>[];
  edges: Edge[];
  counters: Record<NodeKind, number>;
};
```

### Nice-to-haves included

- **MiniMap**, **Controls**, and **Background** (React Flow)
- **Snap-to-grid** enabled (16px grid)

---

## Tech Stack

Versions reflect `package.json`:

- Next.js **16.1.6** (App Router)
- React / React DOM **19.2.3**
- TypeScript **^5**
- React Flow **^11.11.4**
- nanoid **^5.1.6**
- Tailwind CSS (imported via `@import "tailwindcss"` in `globals.css`)

---

## Main architecture decisions (Part 1 project)

### 1) App Router used as a stable shell

This project uses Next.js App Router primarily as a shell:

- `app/layout.tsx` provides global layout + styles
- `app/page.tsx` renders the funnel builder experience

This keeps routing simple while still using modern Next.js conventions.

### 2) Clear separation of concerns: UI, rules, persistence

The code is structured so each responsibility is isolated:

- **UI / Canvas**: React Flow integration + interaction logic lives in `FunnelBuilder`
- **Node rendering**: node UI encapsulated in `FunnelNode`
- **Rules/validation**: validation logic in `funnelRules.ts` so it can evolve without touching UI
- **Storage**: persistence in `storage.ts` so it stays testable and replaceable (localStorage → API later)

### 3) Undo/Redo is modeled explicitly

Instead of relying on implicit mutation, the app maintains a history stack for undo/redo. This makes behavior predictable and easier to extend (bulk ops, multi-select transforms, etc.).

### 4) Export format is versioned

Exported JSON includes `version: 1` so future schema changes can be handled via migrations without breaking existing exports.

---

## Tradeoffs and what I’d improve next

### Tradeoffs made (intentionally)

- **Local-only persistence** (localStorage) keeps scope tight but doesn’t support multi-device or collaboration.
- **Light validation** focuses on UX feedback rather than enforcing a full “funnel schema correctness” model.
- **Single-page tool architecture** is simple, but large feature growth would benefit from stronger module boundaries.

### What I’d improve next

1. **Stronger domain model**
   - Add a real funnel graph validator with explicit invariants (reachable start, terminal nodes, forbidden cycles if needed).
   - Add migration utilities for export versions.

2. **Better editing UX**
   - Multi-select, alignment tools, auto-layout, zoom-to-fit, contextual node menus, edge labels.
   - Inline editing of node metadata (offer copy, pricing, etc.).

3. **Collaboration-ready persistence**
   - Replace localStorage with a backend (REST/GraphQL) + optimistic updates.
   - Add per-funnel IDs, drafts, autosave status, and audit history.

4. **Accessibility**
   - Full keyboard navigation between nodes/edges, ARIA descriptions, focus management, improved non-pointer workflows.

5. **Testing + CI**
   - Unit tests for rules/storage, integration tests for builder state, E2E tests for core flows.

---

# Part 2 — Written Question: Modern Dashboard Architecture

Imagine you are joining Cartpanda to build a modern admin dashboard for a funnels + checkout product:

funnels, orders, customers, subscriptions  
analytics, disputes, settings, permissions

Below is how I’d build this dashboard in a way that:

1. stays fast and consistent as it grows
2. supports multiple engineers shipping in parallel without chaos
3. avoids “big rewrite” traps
4. meets WCAG standards for accessibility

---

## 1) Architecture

### Route/page structure

I’d use **Next.js App Router** with **route groups** and **nested layouts** to enforce consistent structure:

- `(app)/dashboard` layout: global nav, breadcrumbs, page chrome
- Feature routes:
  - `/funnels`
  - `/orders`
  - `/customers`
  - `/subscriptions`
  - `/analytics`
  - `/disputes`
  - `/settings`
  - `/permissions`

Each feature can have its own nested layout where needed (e.g., Settings has left-side subnav; Orders has list/detail patterns).

### Feature modules to avoid spaghetti

I’d implement **feature-first organization** with clear ownership boundaries:

```text
src/
  app/
    (app)/dashboard/...
  features/
    funnels/
      pages/
      components/
      hooks/
      api/
      types/
      validation/
    orders/
    customers/
    subscriptions/
    analytics/
    disputes/
    settings/
    permissions/
  shared/
    ui/
    hooks/
    lib/
    styles/
```

**Rule:** Feature modules own their **routes + queries + components + state**. `shared/` is reserved for reusable primitives and utilities only.

This supports parallel development because teams can work in different feature modules without stepping on each other.

### Domain modules (stable contracts)

For core business entities I’d create domain modules:

- `domain/funnel`
- `domain/order`
- `domain/customer`
- `domain/subscription`
- `domain/dispute`

Each domain exports:

- types (TS + runtime)
- API adapters (fetchers)
- parsing/validation
- derived helpers (formatters, computed fields)

This reduces rewrite risk because the domain layer becomes a stable interface even as UI changes.

---

## 2) Design system

### Build vs buy

I’d **buy + adapt**:

- Use accessible primitives like **Radix UI**
- Wrap them into Cartpanda-styled components (via shadcn/ui-style patterns or internal wrappers)

This prevents reinventing dialogs/menus/inputs and accelerates consistent delivery.

### Enforcing consistency

- Tokenized spacing, typography scale, radii, shadows, and semantic colors (success/warn/error)
- Theming via semantic tokens (`--bg`, `--fg`, `--muted`, `--danger`) so branding changes don’t require rewrites
- Page templates (table page, detail page, settings page) to reduce one-off layouts

### WCAG built in

- Keyboard navigation and visible focus states
- Proper ARIA labeling patterns
- Contrast checks and reduced motion support
- Automated accessibility testing in CI (see Testing section)

---

## 3) Data fetching + state

### Server state vs client state

- Use **TanStack Query** for server state:
  - caching, retries, invalidation, background refetch
- Use lightweight client state only for UI state:
  - column visibility, modal open/close, draft forms, local-only toggles

### Runtime validation

Validate API responses at runtime with **Zod** (or similar). This prevents silent breakages when backend responses shift.

### Loading/error/empty states

Standardize states across features:

- Skeletons for table pages
- Empty states with clear actions (e.g., “Create your first funnel”)
- Error states with retry + automatic reporting to monitoring

### Filters/sorts/pagination on tables

For tables (Orders/Customers):

- Use **URL-driven table state**:
  - `?q=&status=&sort=&page=&pageSize=`
- Benefits:
  - shareable links
  - refresh-safe
  - deep linking from analytics → filtered lists
- Implementation:
  - shared table controller hook
  - server-driven pagination
  - debounced search, stable sort keys

---

## 4) Performance

### Keeping it fast as it grows

- Route-level code splitting (default in Next)
- Dynamic import heavy areas (charts, editors)
- Prefer server components for static chrome and low-interactivity screens where possible

### Avoiding rerenders

- Memoize heavy row renderers and derived computations
- Virtualize large tables/lists (TanStack Virtual)
- Avoid unstable props in large lists (stable keys, fewer inline callbacks)

### Instrumentation (“dashboard feels slow”)

Measure:

- Web Vitals (LCP, INP, CLS)
- time-to-first-data (first successful query)
- interaction latency for key workflows (open order, refund/dispute action, update subscription)

Use:

- performance marks and tracing
- error monitoring + performance monitoring (e.g., Sentry)
- RUM (Datadog/New Relic) if available

---

## 5) DX (developer experience) & scaling to a team

### Onboarding into patterns

- “How we build dashboard features” doc:
  - folder structure
  - how to add routes/pages
  - how to build tables with filters
  - query + schema validation patterns
- Starter templates (optional generator) for new features

### Conventions enforced

- ESLint + Prettier + strict TypeScript
- consistent import rules + path aliases
- PR template requiring:
  - screenshots
  - test plan
  - accessibility checklist
  - perf considerations when relevant

### Preventing one-off UI and inconsistent behavior

- Shared primitives are the only approved building blocks for controls
- Storybook (or equivalent) for component docs and usage examples
- component guidelines: props conventions, loading state patterns, empty state patterns

---

## 6) Testing strategy

### Unit vs integration vs E2E

- **Unit tests**
  - domain helpers, validators, formatters
  - Zod schemas for critical API responses
  - table controller serialization logic
- **Integration tests**
  - feature pages with mocked APIs (loading → data → error)
  - permissions and conditional rendering
- **E2E tests** (Playwright/Cypress)
  - critical flows:
    - create funnel
    - filter/sort orders table
    - open order detail + perform action (refund/dispute flow)
    - permissions restrict access appropriately

### Minimum testing before moving fast

- unit tests for domain logic
- E2E smoke tests for core workflows
- CI gates for lint/typecheck/tests

---

## 7) Release & quality

### Feature flags + staged rollouts

- feature flags for risky changes (analytics revamp, disputes flow)
- staged rollout: internal → beta → full
- fast rollback/disable path when possible

### Monitoring + error handling

- Sentry for errors + performance traces
- alerting on API error rate spikes and slow endpoints
- structured logs with org/user context (privacy-safe)

### Ship fast but safe

- small PRs + clear boundaries
- flags for riskier changes
- “definition of done” includes tests and monitoring hooks

---

## Summary of concrete choices

- Next.js App Router with route groups + nested layouts
- feature-first modules with domain modules for stability
- Radix UI + tokens + shared wrappers for consistent accessible UI
- TanStack Query for server state + URL-driven table state
- Zod runtime validation for API responses
- virtualization + instrumentation for performance
- testing pyramid: unit + integration + E2E smoke
- feature flags + staged rollouts + monitoring

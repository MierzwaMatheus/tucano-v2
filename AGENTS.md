# Tucano Finanças - Agent Guidelines

## Project Overview

**Type:** Full-stack SPA (React + Vite + Convex)
**Stack:** React 19, TypeScript, Vite, Convex, Tailwind CSS, Lucide Icons
**Architecture:** Frontend Clean Architecture with Convex backend

---

## Build/Lint/Test Commands

### Development

```bash
npm run dev                # Start frontend + backend (parallel)
npm run dev:frontend       # Vite dev server only
npm run dev:backend        # Convex dev only
```

### Production Build

```bash
npm run build              # Full build (typecheck + convex check + vite build)
```

### Linting & Type Checking

```bash
npm run lint               # Full lint: tsc convex, tsc app, convex check, vite build
# Manual type checks:
tsc -p convex -noEmit      # Check Convex backend types
tsc -p . -noEmit           # Check frontend types
convex dev --once          # Validate Convex functions
```

### Testing

- **Framework:** Use `convex-test` with `vitest` and `@edge-runtime/vm`
- **Config:** `vitest.config.ts` with `environment: "edge-runtime"`
- **Location:** Test files inside `convex/` directory
- **Single test:** `npx vitest run convex/<test-file>.test.ts`
- **All tests:** `npx vitest run`

---

## Code Architecture

### Structure

```
/src
  /components    # UI components (Modal, ConfirmDialog, etc.)
  /pages         # Page-level components (FinancePage, ShoppingPage, etc.)
  /lib           # Utilities (utils.ts, currency.ts, dates.ts)
  App.tsx        # Main app with routing
  main.tsx       # Entry point

/convex
  schema.ts      # Database schema
  *.ts           # Convex functions (queries, mutations, actions)
  /_generated    # Auto-generated types (DO NOT EDIT)
```

### Clean Architecture Rules

**Components:**

- Only UI and orchestration
- No business logic
- No direct HTTP calls

**Hooks:**

- Adapters between UI and use cases
- Manage state and side effects
- No complex business logic

**Convex Functions:**

- Business logic lives in queries/mutations
- Never import React
- Never use useState/useEffect
- Always depend on interfaces

---

## Import Guidelines

### Order

1. External packages (React, Convex, Lucide, etc.)
2. Internal absolute imports (`@/` alias)
3. Relative imports (`./`, `../`)

### Path Alias

Use `@/` for src imports:

```typescript
import { Modal } from "@/components/Modal";
import { formatBRL } from "@/lib/currency";
```

### Convex Imports

```typescript
import { api } from "../../convex/_generated/api"; // Function references
import { Id, Doc } from "../../convex/_generated/dataModel"; // Types
import { query, mutation } from "../../convex/_generated/server"; // Functions
```

---

## TypeScript Guidelines

### Strict Mode

- `strict: true` enabled
- No `any` types (use proper context types)
- Use `Id<"tableName">` for document IDs (not `string`)
- Use `Doc<"tableName">` for full document types

### Type Definitions

```typescript
// Use type for simple shapes
type Tab = "finance" | "shopping" | "cards" | "categories";

// Use interface for component props
interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}
```

### Convex Types

```typescript
// CORRECT
const userId: Id<"users"> = ...
const transaction: Doc<"transactions"> = ...

// WRONG
const userId: string = ...
```

---

## Naming Conventions

### Files

- Components: PascalCase (`Modal.tsx`, `FinancePage.tsx`)
- Utilities: camelCase (`utils.ts`, `currency.ts`)
- Convex: camelCase (`transactions.ts`, `shoppingLists.ts`)

### Variables

- camelCase for variables/functions
- PascalCase for components/types/interfaces
- UPPER_CASE for constants

### Convex Functions

```typescript
export const list = query({ ... });
export const addTransaction = mutation({ ... });
export const summarize = query({ ... });
```

---

## Formatting

### Tailwind CSS

- Use semantic tokens from `tailwind.config.js`
- NEVER use hardcoded values
- NEVER use default Tailwind colors/radius
- Use `cn()` utility for conditional classes

```typescript
// CORRECT - semantic tokens
<div className="bg-surface-card text-text-primary border-border-subtle">

// WRONG - hardcoded
<div className="bg-gray-800 text-white">
```

### Components

- Functional components with explicit return types
- Props interface before component
- Destructure props in function signature

```typescript
interface Props {
  title: string;
}

export function Modal({ title }: Props): JSX.Element {
  return <div>...</div>;
}
```

---

## Convex Best Practices

### Validators

- ALWAYS include argument validators for all functions
- Use `v.union()` for discriminated unions
- Use `paginationOptsValidator` for pagination

### Queries

- Use `withIndex()` instead of `filter()`
- Return bounded collections (`.take()` or paginate, never `.collect()`)
- NEVER use `.collect().length` for counting

### Mutations

- Use `ctx.db.patch()` for partial updates
- Use `ctx.db.replace()` for full replacement
- All mutations are transactions

### Indexes

- Name indexes with all fields: `by_user_status` for `["userId", "status"]`
- Query fields in index order

### Authentication

- NEVER accept `userId` as argument - derive from `ctx.auth.getUserIdentity()`
- Use `identity.tokenIdentifier` for auth-linked lookups

---

## Error Handling

### Frontend

- Use try/catch for async operations
- Show user-friendly error messages
- Log only at boundaries (not in business logic)

### Convex

- Validators handle argument validation
- Convex automatically logs errors
- Use TypeScript types for safety

---

## Visual Identity (CRITICAL)

### Color Palette

**ONE accent color only:** `accent-primary` (#2BD97F)

- Actions: accent-primary
- Active elements: accent-primary
- Income indicators: accent-primary

**Status colors:**

- Success: `status-success` (#2BD97F)
- Error: `status-error` (#FF5C5C)
- Warning: `status-warning` (#FFB020)

### Semantic Tokens (MUST USE)

```typescript
// Backgrounds
bg-surface-page      // Main background
bg-surface-card      // Cards
bg-surface-elevated  // Elevated elements

// Text
text-text-primary    // Titles
text-text-secondary  // Support text
text-text-muted      // Hints

// Borders
border-border-default
border-border-subtle

// Radius
rounded-card         // 16px
rounded-button       // 12px
rounded-input        // 10px
```

### Mobile-First Design

- Bottom navigation (NEVER sidebar on mobile)
- Vertical layout with ONE dominant element per screen
- Top: context, Center: main element, Bottom: actions

### Never

- Multiple colors per category
- Gradient decorations
- Sidebar on mobile
- Hardcoded Tailwind values

---

## Comments & Documentation

- **NO COMMENTS unless explicitly requested**
- Code should be self-documenting
- Use clear naming instead of explaining

---

## Language

**Code:** 100% English (variables, functions, types, files)
**User-facing text:** Portuguese (labels, buttons, messages)

```typescript
// CORRECT
const userId: Id<"users"> = ...
function addTransaction() {}

// WRONG
const usuarioId: Id<"users"> = ...
function adicionarTransacao() {}
```

---

## Commit Guidelines

- Only commit when user explicitly requests
- Never commit secrets (.env, credentials)
- Use conventional commits format when requested

---

## Additional Notes

- This is a **finance + shopping app** focused on financial consciousness
- Visual metaphor: "Silent tool showing money behavior as a living system"
- Deployment: Vercel (frontend) + Convex (backend)
- Convex deployment: `modest-eagle-555`

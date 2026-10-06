# ERP App — Claude Project Instructions

## Project Overview

Modern ERP frontend built with React 19 + TypeScript + Ant Design 6.
Backend is a real Laravel API — **ERP-BE**, a separate repo (not a subfolder of this one; typically checked out as a sibling, e.g. `D:\ERP-BE\ERP-BE`). The frontend talks to it directly over HTTPS (base URL in `VITE_API_BASE_URL`, see `.env`/`.env.example`). Do not mock or invent endpoints/fields for a module — if a BE contract is missing, read the ERP-BE source (`routes/api.php`, `app/Http/Controllers`, `app/Http/Resources`, `database/migrations`, and its `postman/` collections) or flag the gap to the user instead of guessing.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 8
- **UI Library**: Ant Design 6 (`antd`)
- **Routing**: React Router v7
- **State**: Zustand (global), TanStack Query (server state)
- **Date**: dayjs (Ant Design's peer dependency)
- **Testing**: Vitest + Testing Library
- **Storybook**: v8
- **Linting**: ESLint + Prettier + Husky pre-commit

## Directory Structure

```
src/
  api/                 # Real API calls per module (fetch wrapper in api/client.ts)
  components/ui/       # Reusable design-system components (wrappers + ERP-specific)
  components/erp/      # Composed ERP domain components
  modules/
    hr/                # HR & Payroll — wired to ERP-BE
    masters/           # Item/party/UOM/HSN/category masters — wired to ERP-BE
    procurement/       # Purchase Requisition/Enquiry/Order/GRN — wired to ERP-BE
    production/        # Job cards, BOM, process routes, material issue — wired to ERP-BE
    sales/             # Sales Enquiry/Quotation/Order/Delivery Challan/Invoice — wired to ERP-BE
    inventory/         # Stock Requisition/Adjustment/Issue/Ledger/Balance — wired to ERP-BE
  layouts/             # AppLayout, Sidebar, PageShell, navConfig
  hooks/               # Shared custom hooks
  store/               # Zustand stores (authStore + per-module filter/UI stores)
  types/
    api/               # Snake_case API DTOs, one file per module, mirrors ERP-BE Resources
    <module>.ts        # camelCase domain types consumed by components
  stories/             # Storybook stories
```

Finance and CRM have no code yet (not even a stub folder) — treat them as not started if asked.

## Coding Conventions

- Functional components only — no class components
- Named exports for components; default exports only in route-level pages
- Co-locate component tests: `ComponentName.test.tsx` next to the component
- Co-locate Storybook stories: `ComponentName.stories.tsx` next to the component
- Path alias `@/` maps to `src/` — always use it for imports, never relative `../..`
- Props interface named `ComponentNameProps`, exported
- No `any` — use `unknown` with type guards if type is truly unknown
- Prettier formats on every save via Husky; do not fight the formatter

## Import Order (enforced by ESLint)

1. React
2. External libraries
3. Internal `@/` imports (components, hooks, types)
4. Relative imports (same folder)
5. Styles

## ERP Module Pattern

Each module under `src/modules/<name>/` follows:

```
<module>/
  types.ts        # Domain types
  store/          # Zustand slice
  hooks/          # Module-specific hooks
  pages/
    <Entity>List.tsx
    <Entity>Detail.tsx
    <Entity>Form.tsx
  components/     # Module-specific components
  index.ts        # Public exports
```

## Claude Skills Available (slash commands)

Run these in any Claude Code session within this project:

| Command             | What it does                                                                    |
| ------------------- | ------------------------------------------------------------------------------- |
| `/commit`           | Analyzes `git diff --staged`, writes a conventional commit message              |
| `/ui-review`        | Audits current file/component for UX, accessibility, and ERP design consistency |
| `/component <Name>` | Scaffolds `Component.tsx` + `Component.stories.tsx` + `Component.test.tsx`      |
| `/story <Name>`     | Generates a Storybook story for an existing component                           |
| `/feature <module>` | Scaffolds a full ERP module folder structure                                    |

## Custom Agents (invoke with `--agent <name>`)

| Agent          | Use when...                                               |
| -------------- | --------------------------------------------------------- |
| `product-head` | Reviewing feature completeness, user flow, prioritization |
| `cto`          | Architecture decisions, scalability, security, tech debt  |
| `ceo`          | Business case, ROI, time-to-market decisions              |
| `senior-dev`   | Code quality review, pattern feedback, PR-style critique  |

## Ant Design Conventions

- Use `ConfigProvider` at root for theme tokens — do NOT override with inline `style` unless necessary
- Use `Form.Item` with `name` prop and `rules` for all form fields
- Use `message.success/error` for toasts, not custom implementations
- Use `App.useApp()` hook inside components for `message`, `modal`, `notification`
- DataTable uses the shared `src/components/ui/DataTable` wrapper, not raw `Table` directly

## Key Design Tokens (from ConfigProvider)

- `colorPrimary`: `#1677ff`
- `borderRadius`: `6`

## Before Committing

Run `/commit` to auto-generate the commit message. Pre-commit hook runs:

1. `eslint --fix` on staged `.ts/.tsx` files
2. `prettier --write` on staged files

## API Layer

Real, wired to ERP-BE — not future work. The pattern, established across hr/masters/procurement/production/sales/inventory:

- **HTTP calls**: plain `fetch` via `apiRequest<T>(path, options)` in `src/api/client.ts` — not axios. Builds `${VITE_API_BASE_URL}${path}`, injects `Authorization: Bearer <token>` from `useAuthStore`, clears the session on 401. Throws `ApiRequestError` (`message`, `status`, optional `fieldErrors` from a Laravel 422's `errors` object).
- **Per-module API files**: `src/api/<entity>.ts` (e.g. `stockRequisitions.ts`, `purchaseRequisitions.ts`) export one function per endpoint, typed with the envelopes below.
- **Response envelopes** (`src/types/api.ts`, mirrors ERP-BE's `ApiController`):
  - `ApiEnvelope<T>` → `{ status, message, data: T }`
  - `PaginatedEnvelope<T>` → `{ status, message, data: T[], meta: { current_page, per_page, total, last_page } }`
  - A few legacy endpoints (e.g. party master) return Laravel's raw paginator instead — noted inline where that's the case.
- **Types split**: `src/types/api/<module>.ts` holds the snake_case `Api*` DTOs and `*Payload` request shapes exactly as ERP-BE serializes/expects them; `src/types/<module>.ts` holds the camelCase domain types components actually consume. A `to<Entity>()` mapper function in the corresponding hook converts one to the other — never leak snake_case DTOs into components.
- **Hooks**: `src/modules/<name>/hooks/use<Entity>.ts` wraps the API file with TanStack Query — one `useQuery` per read, one `useMutation` per write, invalidating the relevant `queryKey`s `onSuccess`.
- **Item pickers**: reuse `useProcurementItems()` (`src/modules/procurement/hooks/useProcurementItems.ts`) rather than re-querying item master per module — it already combines Finished Goods/Raw Materials/Consumables and exposes `batchTracking`/`heatTracking`/`serialTracking` flags needed to conditionally require batch/heat fields.
- **Never mock a missing endpoint or field.** If ERP-BE doesn't have it yet, say so and stop — don't invent a shape.

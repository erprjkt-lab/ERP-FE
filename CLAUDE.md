# ERP App — Claude Project Instructions

## Project Overview
Modern ERP frontend built with React 19 + TypeScript + Ant Design 6.
Backend is not yet decided — all data is currently mocked or typed as interfaces.

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
  components/ui/       # Reusable design-system components (wrappers + ERP-specific)
  components/erp/      # Composed ERP domain components
  modules/
    hr/                # HR & Payroll module
    finance/           # Finance & Accounting (stub)
    inventory/         # Inventory (stub)
    crm/               # CRM (stub)
  layouts/             # AppLayout, Sidebar, PageShell
  hooks/               # Shared custom hooks
  store/               # Zustand stores
  types/               # Shared TypeScript types
  stories/             # Storybook stories
```

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

| Command | What it does |
|---|---|
| `/commit` | Analyzes `git diff --staged`, writes a conventional commit message |
| `/ui-review` | Audits current file/component for UX, accessibility, and ERP design consistency |
| `/component <Name>` | Scaffolds `Component.tsx` + `Component.stories.tsx` + `Component.test.tsx` |
| `/story <Name>` | Generates a Storybook story for an existing component |
| `/feature <module>` | Scaffolds a full ERP module folder structure |

## Custom Agents (invoke with `--agent <name>`)
| Agent | Use when... |
|---|---|
| `product-head` | Reviewing feature completeness, user flow, prioritization |
| `cto` | Architecture decisions, scalability, security, tech debt |
| `ceo` | Business case, ROI, time-to-market decisions |
| `senior-dev` | Code quality review, pattern feedback, PR-style critique |

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

## API Layer (Future)
When backend is decided, API calls go in `src/api/<module>.ts`. Use TanStack Query hooks in `src/modules/<name>/hooks/use<Entity>.ts`.

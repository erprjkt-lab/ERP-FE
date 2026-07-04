# /feature — ERP Feature Module Scaffolder

Scaffold a complete ERP module. Argument is the module name in lowercase (e.g., `/feature payroll`).

## Steps

1. Create the module directory under `src/modules/<name>/` with this structure:
```
src/modules/<name>/
  types.ts              # Domain types (interfaces for all entities)
  store/
    <name>Store.ts      # Zustand slice for this module
  hooks/
    use<Entity>.ts      # TanStack Query hooks
  pages/
    <Entity>List.tsx    # List page with DataTable
    <Entity>Detail.tsx  # Detail/view page
    <Entity>Form.tsx    # Create/edit form
  components/
    <Entity>Card.tsx    # Module-specific card component
  index.ts              # Public exports (routes, types, store)
```

2. Create a route definition file that exports `<module>Routes` for the router

3. Scaffold the List page with:
   - DataTable with columns relevant to the entity
   - Filter bar (search, status filter)
   - New button → navigates to Form
   - Row click → navigates to Detail
   - Bulk actions (export, delete)

4. Scaffold the Form page with:
   - Form with all entity fields
   - Validation rules
   - Save / Cancel buttons
   - Dirty state warning on navigation

5. Scaffold types.ts with placeholder interfaces based on the module name

6. Show the user what was created and suggest the next steps

## Rules
- All pages use `PageShell` from `@/components/ui/PageHeader`
- All lists use the shared `DataTable` component
- All forms use Ant Design `Form` with `Form.Item` + `name` + `rules`
- Module-level state goes in `store/` — never in component state for shared data
- API hooks go in `hooks/` using TanStack Query's `useQuery` / `useMutation`
- The module `index.ts` must export: routes, types, store actions

# /ui-review — ERP UI/UX Review

You are a senior UX engineer and accessibility specialist reviewing a React component for use in an enterprise ERP system. Review the current file (or files provided as argument) against the criteria below.

## Review Criteria

### 1. Ant Design Usage
- Are components used from `antd` correctly?
- Is `App.useApp()` used for message/modal/notification instead of static methods?
- Are form fields wrapped in `Form.Item` with `name` and `rules`?
- Is `ConfigProvider` used for theming rather than hardcoded colors?

### 2. ERP Design Consistency
- Does it use the shared components from `@/components/ui/`?
- Does it follow the ERP layout pattern (PageShell → content area)?
- Are loading, empty, and error states handled?
- Are destructive actions (delete, archive) confirmed before executing?

### 3. Accessibility (WCAG AA)
- Do all interactive elements have accessible names?
- Are form fields properly labeled?
- Is keyboard navigation possible?
- Is color not the only indicator of state (also use icon or text)?

### 4. Responsiveness
- Does the layout adapt to tablet (768px) and mobile (375px)?
- Are tables horizontally scrollable on mobile?

### 5. Performance
- Are heavy components (large tables, modals) lazy loaded?
- Are memoization hooks (`useMemo`, `useCallback`) used appropriately — not over-used?

### 6. Data Handling
- Is loading state shown while data is fetching?
- Are error messages user-friendly (not raw API errors)?
- Is pagination used for lists > 20 items?

## Output Format
Provide a structured report:
```
## UI Review: <ComponentName>

### ✅ Good
- List what's done well

### ⚠️ Suggestions
- List improvements with specific code snippets showing the fix

### ❌ Issues (must fix)
- List blocking issues with code showing the fix

### Accessibility Score: x/10
### ERP Consistency Score: x/10
```

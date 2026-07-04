# /component — ERP Component Scaffolder

Scaffold a new reusable UI component for the ERP app. The argument is the component name in PascalCase (e.g., `/component StatusChip`).

## Steps

1. Determine the component category:
   - If it's a generic UI primitive → create in `src/components/ui/<Name>/`
   - If it's ERP-domain specific → create in `src/components/erp/<Name>/`

2. Create three files:

### `<Name>.tsx`
```tsx
import type { FC } from 'react'

export interface <Name>Props {
  // props here
}

export const <Name>: FC<<Name>Props> = ({ ...props }) => {
  return (
    // JSX here
  )
}
```

### `<Name>.stories.tsx`
```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { <Name> } from './<Name>'

const meta = {
  title: 'UI/<Name>',   // or 'ERP/<Name>' for domain components
  component: <Name>,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof <Name>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
```

### `<Name>.test.tsx`
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { <Name> } from './<Name>'

describe('<Name>', () => {
  it('renders correctly', () => {
    render(<Name> />)
    // add assertions
  })
})
```

### `index.ts`
```ts
export { <Name> } from './<Name>'
export type { <Name>Props } from './<Name>'
```

3. Add the export to `src/components/ui/index.ts` (or `erp/index.ts`)

4. Show the user the created files and suggest how to add it to Storybook

## Rules
- Always use TypeScript — no `any`
- Props interface must be exported
- Every component must have at least a Default story
- Use `@/` path alias for all imports
- Wrap Ant Design components, never duplicate their functionality

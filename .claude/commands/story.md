# /story — Storybook Story Generator

Generate a comprehensive Storybook story file for an existing component. Argument is the component name or file path.

## Steps

1. Read the component file to understand:
   - All props and their types
   - Variants/states the component supports
   - Required vs optional props

2. Generate a `.stories.tsx` file next to the component with:
   - A `Default` story with the most common use case
   - Stories for every meaningful variant (size, type, state)
   - An `AllVariants` story showing everything in one view
   - Interactive stories using `fn()` for callbacks
   - Proper `argTypes` for controls panel

3. For ERP-specific components, add stories for:
   - Loading state
   - Empty state
   - Error state
   - Read-only / disabled state

## Story Template
```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { ComponentName } from './ComponentName'

const meta = {
  title: 'UI/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onClick: fn() },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'default', 'danger'],
    },
  },
} satisfies Meta<typeof ComponentName>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: {} }
export const Loading: Story = { args: { loading: true } }
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* render all variants */}
    </div>
  ),
}
```

## Rules
- Never duplicate the component's own file
- Use `fn()` from `@storybook/test` for all callback props
- Always include `tags: ['autodocs']` for auto documentation
- Titles follow: `UI/<Name>`, `ERP/<Name>`, `Modules/HR/<Name>`

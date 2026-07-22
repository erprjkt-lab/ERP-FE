import { PlusOutlined } from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { EmptyState } from './EmptyState'

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'No employees found',
    description: 'Start by adding your first employee to the system.',
    action: { label: 'Add Employee', onClick: fn(), icon: <PlusOutlined /> },
  },
}

export const Simple: Story = {
  args: {
    title: 'No results',
    description: 'Try adjusting your search or filters.',
    image: 'simple',
  },
}

export const NoAction: Story = {
  args: {
    title: 'No leave requests',
    description: 'No leave requests have been submitted this month.',
  },
}

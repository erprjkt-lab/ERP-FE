import type { Meta, StoryObj } from '@storybook/react'
import { Space } from 'antd'
import { StatusBadge } from './StatusBadge'

const meta = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    status: {
      control: 'select',
      options: [
        'active',
        'inactive',
        'pending',
        'archived',
        'cancelled',
        'approved',
        'rejected',
        'paid',
        'draft',
        'overdue',
      ],
    },
    variant: {
      control: 'select',
      options: ['tag', 'dot', 'text'],
    },
  },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { status: 'active' },
}

export const AllStatuses: Story = {
  args: { status: 'active' },
  render: () => (
    <Space direction="vertical" size="small">
      <Space wrap>
        <StatusBadge status="active" />
        <StatusBadge status="inactive" />
        <StatusBadge status="pending" />
        <StatusBadge status="archived" />
        <StatusBadge status="cancelled" />
      </Space>
      <Space wrap>
        <StatusBadge status="approved" />
        <StatusBadge status="rejected" />
        <StatusBadge status="paid" />
        <StatusBadge status="draft" />
        <StatusBadge status="overdue" />
      </Space>
    </Space>
  ),
}

export const DotVariant: Story = {
  args: { status: 'active' },
  render: () => (
    <Space direction="vertical">
      <StatusBadge status="active" variant="dot" />
      <StatusBadge status="pending" variant="dot" />
      <StatusBadge status="inactive" variant="dot" />
      <StatusBadge status="cancelled" variant="dot" />
    </Space>
  ),
}

export const AllVariants: Story = {
  args: { status: 'active' },
  render: () => (
    <Space direction="vertical" size="large">
      <div>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>Tag (default)</p>
        <Space>
          <StatusBadge status="active" />
          <StatusBadge status="pending" />
          <StatusBadge status="rejected" />
        </Space>
      </div>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>Dot</p>
        <Space direction="vertical">
          <StatusBadge status="active" variant="dot" />
          <StatusBadge status="pending" variant="dot" />
          <StatusBadge status="rejected" variant="dot" />
        </Space>
      </div>
    </Space>
  ),
}

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Space } from 'antd'
import { Button } from './Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { onClick: fn() },
  argTypes: {
    type: {
      control: 'select',
      options: ['primary', 'default', 'dashed', 'link', 'text'],
      description: 'Button variant',
    },
    size: {
      control: 'select',
      options: ['large', 'middle', 'small'],
    },
    danger: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { type: 'primary', children: 'Primary Button' },
}

export const Default: Story = {
  args: { children: 'Default Button' },
}

export const Danger: Story = {
  args: { type: 'primary', danger: true, children: 'Delete' },
}

export const Loading: Story = {
  args: { type: 'primary', loading: true, children: 'Saving...' },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
}

export const WithIcon: Story = {
  args: { type: 'primary', icon: <PlusOutlined />, children: 'Add Employee' },
}

export const AllVariants: Story = {
  render: () => (
    <Space direction="vertical" size="middle">
      <Space wrap>
        <Button type="primary" icon={<PlusOutlined />}>Add New</Button>
        <Button type="default">Default</Button>
        <Button type="dashed">Dashed</Button>
        <Button type="link">Link</Button>
        <Button type="text">Text</Button>
      </Space>
      <Space wrap>
        <Button type="primary" danger icon={<DeleteOutlined />}>Delete</Button>
        <Button type="default" danger>Cancel</Button>
        <Button type="primary" icon={<SaveOutlined />}>Save</Button>
        <Button type="default" icon={<EditOutlined />}>Edit</Button>
      </Space>
      <Space wrap>
        <Button type="primary" size="large">Large</Button>
        <Button type="primary" size="middle">Middle</Button>
        <Button type="primary" size="small">Small</Button>
      </Space>
      <Space wrap>
        <Button type="primary" loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </Space>
    </Space>
  ),
}

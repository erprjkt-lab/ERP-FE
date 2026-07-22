import { PlusOutlined, ExportOutlined } from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { Button, Input } from 'antd'
import { PageHeader } from './PageHeader'

const meta = {
  title: 'UI/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded', backgrounds: { default: 'white' } },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Employees',
    subtitle: '248 employees across all departments',
    breadcrumbs: [{ label: 'HR', href: '/hr' }, { label: 'Employees' }],
    actions: (
      <>
        <Button icon={<ExportOutlined />}>Export</Button>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Employee
        </Button>
      </>
    ),
  },
}

export const WithFilters: Story = {
  args: {
    title: 'Employees',
    subtitle: '248 employees',
    breadcrumbs: [{ label: 'HR', href: '/hr' }, { label: 'Employees' }],
    actions: (
      <Button type="primary" icon={<PlusOutlined />}>
        Add Employee
      </Button>
    ),
    children: (
      <Input.Search placeholder="Search by name, ID, or email..." style={{ maxWidth: 320 }} />
    ),
  },
}

export const Simple: Story = {
  args: {
    title: 'Dashboard',
  },
}

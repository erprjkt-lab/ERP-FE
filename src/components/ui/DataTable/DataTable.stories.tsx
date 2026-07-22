import type { Meta, StoryObj } from '@storybook/react'
import type { AnyObject } from 'antd/es/_util/type'
import type { TableColumnsType } from 'antd'
import { Tag } from 'antd'
import { DataTableComponent } from './DataTable'

interface SampleRow {
  key: string
  name: string
  department: string
  status: 'active' | 'inactive' | 'pending'
  salary: number
  joinDate: string
}

const SAMPLE_DATA: SampleRow[] = Array.from({ length: 50 }, (_, i) => ({
  key: String(i),
  name: `Employee ${i + 1}`,
  department: ['Engineering', 'HR', 'Finance', 'Operations', 'Sales'][i % 5],
  status: (['active', 'inactive', 'pending'] as const)[i % 3],
  salary: 50000 + i * 1000,
  joinDate: `2024-0${(i % 9) + 1}-01`,
}))

const STATUS_COLORS = { active: 'green', inactive: 'default', pending: 'orange' } as const

const COLUMNS: TableColumnsType<AnyObject> = [
  { title: 'Name', dataIndex: 'name' },
  {
    title: 'Department',
    dataIndex: 'department',
    filters: [
      { text: 'Engineering', value: 'Engineering' },
      { text: 'HR', value: 'HR' },
      { text: 'Finance', value: 'Finance' },
    ],
    onFilter: (value, record) => record['department'] === value,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    render: (s: SampleRow['status']) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
  },
  { title: 'Salary', dataIndex: 'salary', render: (v: number) => `₹${v.toLocaleString('en-IN')}` },
  { title: 'Join Date', dataIndex: 'joinDate' },
]

const meta = {
  title: 'UI/DataTable',
  component: DataTableComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DataTableComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns: COLUMNS,
    dataSource: SAMPLE_DATA,
    totalLabel: 'employees',
  },
}

export const Loading: Story = {
  args: {
    columns: COLUMNS,
    dataSource: [],
    loading: true,
    totalLabel: 'employees',
  },
}

export const Empty: Story = {
  args: {
    columns: COLUMNS,
    dataSource: [],
    totalLabel: 'employees',
  },
}

export const WithRowSelection: Story = {
  args: {
    columns: COLUMNS,
    dataSource: SAMPLE_DATA.slice(0, 10),
    rowSelection: { type: 'checkbox' },
    totalLabel: 'employees',
  },
}

export const NoPagination: Story = {
  args: {
    columns: COLUMNS,
    dataSource: SAMPLE_DATA.slice(0, 5),
    pagination: false,
  },
}

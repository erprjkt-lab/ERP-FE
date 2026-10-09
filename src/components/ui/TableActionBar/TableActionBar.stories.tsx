import type { Meta, StoryObj } from '@storybook/react'
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  AreaChartOutlined,
  ClusterOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import { Tag } from 'antd'
import { DataTable } from '@/components/ui/DataTable'
import { TableActionBar, createTableActionsColumn } from './TableActionBar'
import type { TableActionItem } from './TableActionBar'

interface SamplePR {
  id: string
  prNumber: string
  date: string
  department: string
  item: string
  qty: number
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
}

const SAMPLE_PR_DATA: SamplePR[] = [
  {
    id: '1',
    prNumber: 'PR-2026-001',
    date: '2026-10-01',
    department: 'Manufacturing',
    item: 'Bath Accessory Fitting',
    qty: 250,
    status: 'PENDING_APPROVAL',
  },
  {
    id: '2',
    prNumber: 'PR-2026-002',
    date: '2026-10-02',
    department: 'Tool Room',
    item: 'Prirubnica Fi90X28',
    qty: 120,
    status: 'APPROVED',
  },
  {
    id: '3',
    prNumber: 'PR-2026-003',
    date: '2026-10-03',
    department: 'Maintenance',
    item: 'Lubricant Oil ISO 68',
    qty: 40,
    status: 'REJECTED',
  },
  {
    id: '4',
    prNumber: 'PR-2026-004',
    date: '2026-10-04',
    department: 'Quality Assurance',
    item: 'Gauge Block Grade 0',
    qty: 5,
    status: 'PENDING_APPROVAL',
  },
]

const meta = {
  title: 'UI/TableActionBar',
  component: TableActionBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TableActionBar>

export default meta
type Story = StoryObj<typeof meta>

export const SingleRowToolbar: Story = {
  args: {
    alwaysVisible: true,
    actions: [
      { key: 'view', label: 'View Details', icon: <EyeOutlined /> },
      { key: 'edit', label: 'Edit', icon: <EditOutlined />, variant: 'primary' },
      { key: 'approve', label: 'Approve', icon: <CheckOutlined />, variant: 'success' },
      { key: 'reject', label: 'Reject', icon: <CloseOutlined />, variant: 'danger', danger: true },
      { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, variant: 'danger', danger: true },
    ],
  },
}

export const ProductTableWithMultipleActions: Story = {
  args: {
    alwaysVisible: true,
    actions: [
      { key: 'edit', label: 'Edit', icon: <EditOutlined />, variant: 'primary' },
      { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, variant: 'danger', danger: true },
      { key: 'refresh', label: 'Sync / Refresh', icon: <ReloadOutlined /> },
      { key: 'add-process', label: 'Add Process', icon: <AreaChartOutlined />, variant: 'primary' },
      { key: 'doc', label: 'View Documents', icon: <FileTextOutlined /> },
      { key: 'hierarchy', label: 'BOM / Hierarchy', icon: <ClusterOutlined /> },
      { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
    ],
  },
}

export const PurchaseRequisitionsTableExample: StoryObj = {
  render: () => {
    const columns: TableColumnsType<SamplePR> = [
      {
        title: 'P.R. No / Date',
        key: 'pr',
        render: (_, r) => (
          <div>
            <div style={{ fontWeight: 600 }}>{r.prNumber}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.date}</div>
          </div>
        ),
      },
      { title: 'Department', dataIndex: 'department', key: 'department' },
      { title: 'Item', dataIndex: 'item', key: 'item' },
      { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
      {
        title: 'Status',
        key: 'status',
        render: (_, r) => {
          const color =
            r.status === 'APPROVED' ? 'green' : r.status === 'PENDING_APPROVAL' ? 'orange' : 'red'
          return <Tag color={color}>{r.status.replace('_', ' ')}</Tag>
        },
      },
      createTableActionsColumn<SamplePR>({
        width: 170,
        actions: record => {
          const actions: TableActionItem[] = [
            {
              key: 'view',
              label: 'View',
              icon: <EyeOutlined />,
              onClick: () => alert(`View ${record.prNumber}`),
            },
          ]
          if (record.status === 'PENDING_APPROVAL') {
            actions.push(
              {
                key: 'edit',
                label: 'Edit',
                icon: <EditOutlined />,
                variant: 'primary',
                onClick: () => alert(`Edit ${record.prNumber}`),
              },
              {
                key: 'approve',
                label: 'Approve',
                icon: <CheckOutlined />,
                variant: 'success',
                onClick: () => alert(`Approve ${record.prNumber}`),
              },
              {
                key: 'reject',
                label: 'Reject',
                icon: <CloseOutlined />,
                variant: 'danger',
                danger: true,
                onClick: () => alert(`Reject ${record.prNumber}`),
              },
              {
                key: 'delete',
                label: 'Delete',
                icon: <DeleteOutlined />,
                variant: 'danger',
                danger: true,
                onClick: () => alert(`Delete ${record.prNumber}`),
              },
            )
          } else if (record.status === 'APPROVED') {
            actions.push({
              key: 'enquiry',
              label: 'Create Enquiry',
              icon: <FileSearchOutlined />,
              variant: 'accent',
              onClick: () => alert(`Create Enquiry for ${record.prNumber}`),
            })
          }
          return actions
        },
      }),
    ]

    return (
      <DataTable<SamplePR>
        columns={columns}
        dataSource={SAMPLE_PR_DATA}
        rowKey="id"
        pagination={false}
      />
    )
  },
}

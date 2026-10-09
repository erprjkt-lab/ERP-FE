import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui'
import type { StockAdjustment } from '@/types/inventory'
import { StockAdjustmentFormDrawer } from '../components/StockAdjustmentFormDrawer'
import { STOCK_ADJUSTMENT_STATUS_BADGE, STOCK_ADJUSTMENT_STATUS_LABELS } from '../constants'
import {
  useApproveStockAdjustment,
  useDeleteStockAdjustment,
  useStockAdjustments,
} from '../hooks/useStockAdjustments'
import { useInventoryFilters, useInventoryStore } from '../store/inventoryStore'

const STATUS_OPTIONS = Object.entries(STOCK_ADJUSTMENT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface RowActions {
  onView: (record: StockAdjustment) => void
  onEdit: (record: StockAdjustment) => void
  onApprove: (record: StockAdjustment) => void
  onDelete: (record: StockAdjustment) => void
}

const getColumns = (): TableColumnsType<StockAdjustment> => [
  { title: 'Adjustment #', dataIndex: 'adjustmentNumber', key: 'adjustmentNumber', width: 150 },
  { title: 'Date', dataIndex: 'adjustmentDate', key: 'adjustmentDate', width: 110 },
  { title: 'Location', dataIndex: 'locationName', key: 'locationName', render: v => v ?? '—' },
  {
    title: 'Items',
    key: 'items',
    render: (_: unknown, record: StockAdjustment) => {
      const names = record.items.map(i => i.itemName ?? i.itemCode ?? '—').filter(Boolean)
      if (names.length === 0) return '—'
      const preview = names.slice(0, 2).join(', ')
      const extra = names.length > 2 ? ` +${names.length - 2} more` : ''
      return (
        <Tooltip title={names.join(', ')} placement="topLeft">
          <span style={{ cursor: 'default' }}>
            {preview}
            {extra}
          </span>
        </Tooltip>
      )
    },
  },
  { title: 'Reason', dataIndex: 'reason', key: 'reason' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={STOCK_ADJUSTMENT_STATUS_BADGE[status as StockAdjustment['status']]}
        label={STOCK_ADJUSTMENT_STATUS_LABELS[status as StockAdjustment['status']]}
      />
    ),
  },
]

const getAdjustmentActions = (record: StockAdjustment, a: RowActions): TableActionItem[] => {
  const isPending = record.status === 'PENDING_APPROVAL'
  const actions: TableActionItem[] = [
    {
      key: 'view',
      label: 'View',
      icon: <EyeOutlined />,
      variant: 'default',
      onClick: () => a.onView(record),
    },
  ]

  if (isPending) {
    actions.push(
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        variant: 'primary',
        onClick: () => a.onEdit(record),
      },
      {
        key: 'approve',
        label: 'Approve',
        icon: <CheckOutlined />,
        variant: 'success',
        onClick: () => a.onApprove(record),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        variant: 'danger',
        danger: true,
        onClick: () => a.onDelete(record),
      },
    )
  }

  return actions
}

export const StockAdjustmentList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: adjustments, isLoading } = useStockAdjustments()
  const { mutateAsync: deleteAdjustment } = useDeleteStockAdjustment()
  const { mutateAsync: approve } = useApproveStockAdjustment()
  const filters = useInventoryFilters('adjustment')
  const setFilter = useInventoryStore(s => s.setFilter)
  const resetFilters = useInventoryStore(s => s.resetFilter)

  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()

  const handleApprove = (record: StockAdjustment) => {
    modal.confirm({
      title: 'Approve this adjustment?',
      content:
        'This posts the variance to the stock ledger immediately and cannot be undone from here.',
      okText: 'Approve',
      onOk: async () => {
        try {
          await approve(record.id)
          message.success('Stock adjustment approved and posted to the ledger')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleDelete = (record: StockAdjustment) => {
    modal.confirm({
      title: 'Delete this adjustment?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteAdjustment(record.id)
          message.success('Stock adjustment deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns()

  const rowActions: RowActions = {
    onView: record => navigate(`/inventory/adjustments/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onApprove: handleApprove,
    onDelete: handleDelete,
  }

  const filtered = adjustments.filter(adj => {
    if (
      filters.search &&
      !adj.adjustmentNumber.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false
    }
    if (filters.status && adj.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Stock Adjustments"
        subtitle={`${filtered.length} of ${adjustments.length} adjustments`}
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Adjustments' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerState({ mode: 'add' })}
          >
            New Adjustment
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by adjustment #..."
              value={filters.search}
              onChange={e => setFilter('adjustment', 'search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={v => setFilter('adjustment', 'status', v)}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={() => resetFilters('adjustment')}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<StockAdjustment>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="adjustments"
          fillHeight
          rowActions={record => getAdjustmentActions(record, rowActions)}
          onRow={record => ({
            onClick: () => navigate(`/inventory/adjustments/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <StockAdjustmentFormDrawer
        open={!!drawerState}
        onClose={() => setDrawerState(undefined)}
        adjustmentId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
      />
    </div>
  )
}

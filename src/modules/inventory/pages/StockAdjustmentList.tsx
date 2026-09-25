import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StockAdjustment } from '@/types/inventory'
import { STOCK_ADJUSTMENT_STATUS_BADGE, STOCK_ADJUSTMENT_STATUS_LABELS } from '../constants'
import { useDeleteStockAdjustment, useStockAdjustments } from '../hooks/useStockAdjustments'
import { useInventoryFilters, useInventoryStore } from '../store/inventoryStore'
import { getErrorMessage } from '@/api/client'

const STATUS_OPTIONS = Object.entries(STOCK_ADJUSTMENT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (
  onView: (record: StockAdjustment) => void,
  onDelete: (record: StockAdjustment) => void,
): TableColumnsType<StockAdjustment> => [
  { title: 'Adjustment #', dataIndex: 'adjustmentNumber', key: 'adjustmentNumber', width: 140 },
  { title: 'Date', dataIndex: 'adjustmentDate', key: 'adjustmentDate', width: 120 },
  { title: 'Location', dataIndex: 'locationName', key: 'locationName', render: v => v ?? '—' },
  { title: 'Reason', dataIndex: 'reason', key: 'reason' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => (
      <StatusBadge
        status={STOCK_ADJUSTMENT_STATUS_BADGE[status as StockAdjustment['status']]}
        label={STOCK_ADJUSTMENT_STATUS_LABELS[status as StockAdjustment['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 90,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="View">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
        </Tooltip>
        {record.status === 'DRAFT' && (
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            />
          </Tooltip>
        )}
      </Space>
    ),
  },
]

export const StockAdjustmentList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: adjustments, isLoading } = useStockAdjustments()
  const { mutateAsync: deleteAdjustment } = useDeleteStockAdjustment()
  const filters = useInventoryFilters('adjustment')
  const setFilter = useInventoryStore(s => s.setFilter)
  const resetFilters = useInventoryStore(s => s.resetFilter)

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

  const columns = getColumns(
    record => navigate(`/inventory/adjustments/${record.id}`),
    handleDelete,
  )

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
            onClick={() => navigate('/inventory/adjustments/new')}
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
          onRow={record => ({
            onClick: () => navigate(`/inventory/adjustments/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

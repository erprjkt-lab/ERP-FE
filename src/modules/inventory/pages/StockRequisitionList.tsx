import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StockRequisition } from '@/types/inventory'
import { STOCK_REQUISITION_STATUS_BADGE, STOCK_REQUISITION_STATUS_LABELS } from '../constants'
import { useDeleteStockRequisition, useStockRequisitions } from '../hooks/useStockRequisitions'
import { useInventoryFilters, useInventoryStore } from '../store/inventoryStore'
import { getErrorMessage } from '@/api/client'

const STATUS_OPTIONS = Object.entries(STOCK_REQUISITION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (
  onView: (record: StockRequisition) => void,
  onDelete: (record: StockRequisition) => void,
): TableColumnsType<StockRequisition> => [
  { title: 'Requisition #', dataIndex: 'requisitionNumber', key: 'requisitionNumber', width: 140 },
  { title: 'Date', dataIndex: 'requisitionDate', key: 'requisitionDate', width: 120 },
  {
    title: 'Department',
    dataIndex: 'departmentName',
    key: 'departmentName',
    render: v => v ?? '—',
  },
  { title: 'Priority', dataIndex: 'priority', key: 'priority' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => (
      <StatusBadge
        status={STOCK_REQUISITION_STATUS_BADGE[status as StockRequisition['status']]}
        label={STOCK_REQUISITION_STATUS_LABELS[status as StockRequisition['status']]}
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

export const StockRequisitionList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: requisitions, isLoading } = useStockRequisitions()
  const { mutateAsync: deleteRequisition } = useDeleteStockRequisition()
  const filters = useInventoryFilters('requisition')
  const setFilter = useInventoryStore(s => s.setFilter)
  const resetFilters = useInventoryStore(s => s.resetFilter)

  const handleDelete = (record: StockRequisition) => {
    modal.confirm({
      title: 'Delete this requisition?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRequisition(record.id)
          message.success('Stock requisition deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns(
    record => navigate(`/inventory/requisitions/${record.id}`),
    handleDelete,
  )

  const filtered = requisitions.filter(sr => {
    if (
      filters.search &&
      !sr.requisitionNumber.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false
    }
    if (filters.status && sr.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Stock Requisitions"
        subtitle={`${filtered.length} of ${requisitions.length} requisitions`}
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Requisitions' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/inventory/requisitions/new')}
          >
            New Requisition
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by requisition #..."
              value={filters.search}
              onChange={e => setFilter('requisition', 'search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={v => setFilter('requisition', 'status', v)}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={() => resetFilters('requisition')}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<StockRequisition>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="requisitions"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/inventory/requisitions/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

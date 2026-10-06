import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PurchaseOrder } from '@/types/procurement'
import { PurchaseOrderFormDrawer } from '../components/PurchaseOrderFormDrawer'
import { PO_STATUS_BADGE, PO_STATUS_LABELS } from '../constants'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

const STATUS_OPTIONS = Object.entries(PO_STATUS_LABELS).map(([value, label]) => ({ value, label }))

const getColumns = (
  onView: (record: PurchaseOrder) => void,
  onEdit: (record: PurchaseOrder) => void,
): TableColumnsType<PurchaseOrder> => [
  {
    title: 'P.O. No / Date',
    key: 'poNumber',
    width: 140,
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 600 }}>{record.poNumber}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.poDate}</div>
      </div>
    ),
  },
  { title: 'Supplier', dataIndex: 'supplierName', key: 'supplierName' },
  {
    title: 'Item Name',
    key: 'itemName',
    render: (_, record) => {
      if (!record.items.length) return '—'
      return record.items[0]?.itemName ?? record.items[0]?.itemId ?? '—'
    },
  },
  {
    title: 'Qty',
    key: 'qty',
    align: 'right' as const,
    width: 80,
    render: (_, record) => {
      if (!record.items.length) return '—'
      const totalQty = record.items.reduce((sum, item) => sum + item.orderedQty, 0)
      return totalQty > 0 ? totalQty : '—'
    },
  },
  {
    title: 'Source',
    key: 'source',
    width: 100,
    render: (_, r) => (r.purchaseEnquiryId ? 'From Enquiry' : 'Direct'),
  },
  {
    title: 'Net Amount',
    key: 'netAmount',
    render: (_, r) => r.netAmount.toFixed(2),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => (
      <StatusBadge
        status={PO_STATUS_BADGE[status as PurchaseOrder['status']]}
        label={PO_STATUS_LABELS[status as PurchaseOrder['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 80,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="View">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={e => {
              e.stopPropagation()
              onView(record)
            }}
          />
        </Tooltip>
        {record.status === 'DRAFT' && (
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={e => {
                e.stopPropagation()
                onEdit(record)
              }}
            />
          </Tooltip>
        )}
      </Space>
    ),
  },
]

export const PurchaseOrderList: FC = () => {
  const navigate = useNavigate()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const { data: orders, isLoading } = usePurchaseOrders()
  const filters = useProcurementFilters('order')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const columns = getColumns(
    record => navigate(`/purchase/orders/${record.id}`),
    record => setDrawerState({ mode: 'edit', id: record.id }),
  )

  const filtered = orders.filter(po => {
    if (filters.search && !po.poNumber.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && po.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Purchase Orders"
        subtitle={`${filtered.length} of ${orders.length} purchase orders`}
        breadcrumbs={[{ label: 'Purchase', href: '/purchase' }, { label: 'Purchase Order' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerState({ mode: 'add' })}
          >
            New Purchase Order
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by PO #..."
              value={filters.search}
              onChange={e => setFilter('order', 'search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={v => setFilter('order', 'status', v)}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={() => resetFilters('order')}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<PurchaseOrder>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="purchase orders"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/purchase/orders/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <PurchaseOrderFormDrawer
        open={!!drawerState}
        orderId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />
    </div>
  )
}

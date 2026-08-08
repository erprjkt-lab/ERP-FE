import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Select, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PurchaseOrder } from '@/types/procurement'
import { PO_STATUS_BADGE, PO_STATUS_LABELS } from '../constants'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

const STATUS_OPTIONS = Object.entries(PO_STATUS_LABELS).map(([value, label]) => ({ value, label }))

const getColumns = (onView: (record: PurchaseOrder) => void): TableColumnsType<PurchaseOrder> => [
  { title: 'PO #', dataIndex: 'poNumber', key: 'poNumber', width: 130 },
  { title: 'Date', dataIndex: 'poDate', key: 'poDate', width: 120 },
  { title: 'Supplier', dataIndex: 'supplierName', key: 'supplierName' },
  {
    title: 'Source',
    key: 'source',
    width: 100,
    render: (_, r) => (r.purchaseEnquiryId ? 'From Enquiry' : 'Direct'),
  },
  {
    title: 'Net Amount',
    key: 'netAmount',
    render: (_, r) => `${r.currency} ${r.netAmount.toFixed(2)}`,
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
    width: 60,
    render: (_, record) => (
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
    ),
  },
]

export const PurchaseOrderList: FC = () => {
  const navigate = useNavigate()
  const { data: orders, isLoading } = usePurchaseOrders()
  const filters = useProcurementFilters('order')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const columns = getColumns(record => navigate(`/purchase/orders/${record.id}`))

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
            onClick={() => navigate('/purchase/orders/new')}
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
    </div>
  )
}

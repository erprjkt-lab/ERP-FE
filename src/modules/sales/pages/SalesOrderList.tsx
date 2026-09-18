import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesOrder } from '@/types/sales'
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from '../constants'
import { useSalesOrders } from '../hooks/useSalesOrders'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (onView: (record: SalesOrder) => void): TableColumnsType<SalesOrder> => [
  { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', width: 150 },
  { title: 'Date', dataIndex: 'orderDate', key: 'orderDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  {
    title: 'Customer PO',
    dataIndex: 'customerPoNo',
    key: 'customerPoNo',
    width: 140,
    render: v => v || '—',
  },
  {
    title: 'Source',
    key: 'source',
    width: 130,
    render: (_, r) => (r.salesQuotationId ? 'From Quotation' : 'Direct'),
  },
  {
    title: 'Net Amount',
    key: 'netAmount',
    width: 130,
    render: (_, r) => r.netAmount.toFixed(2),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={ORDER_STATUS_BADGE[status as SalesOrder['status']]}
        label={ORDER_STATUS_LABELS[status as SalesOrder['status']]}
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

export const SalesOrderList: FC = () => {
  const navigate = useNavigate()
  const status = useSalesStatusFilter('order')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const {
    data: orders,
    meta,
    isLoading,
    isFetching,
  } = useSalesOrders({ page, perPage: pageSize, status })

  // Status filtering happens server-side, so changing it has to send the
  // user back to page 1 — otherwise they can sit on a page number that
  // no longer exists in the filtered result set.
  const handleStatusChange = (value: string | null) => {
    setStatus('order', value ?? null)
    setPage(1)
  }

  const columns = getColumns(record => navigate(`/sales/orders/${record.id}`))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Orders"
        subtitle={`${meta?.total ?? 0} sales orders`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Sales Order' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/orders/new')}
          >
            New Sales Order
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              value={status}
              onChange={handleStatusChange}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          {status && (
            <Col>
              <Button onClick={() => handleStatusChange(null)}>Clear filter</Button>
            </Col>
          )}
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<SalesOrder>
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={isLoading || isFetching}
          pagination={{
            current: page,
            pageSize,
            total: meta?.total ?? 0,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
          totalLabel="sales orders"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/sales/orders/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

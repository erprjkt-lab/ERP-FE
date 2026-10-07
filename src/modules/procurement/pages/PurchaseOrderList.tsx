import { CheckOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PurchaseOrderItemRow } from '@/types/procurement'
import { PurchaseOrderFormDrawer } from '../components/PurchaseOrderFormDrawer'
import { PO_STATUS_BADGE, PO_STATUS_LABELS } from '../constants'
import { useApprovePurchaseOrder, usePurchaseOrderItems } from '../hooks/usePurchaseOrders'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

const STATUS_OPTIONS = Object.entries(PO_STATUS_LABELS).map(([value, label]) => ({ value, label }))

const getColumns = (
  onView: (record: PurchaseOrderItemRow) => void,
  onEdit: (record: PurchaseOrderItemRow) => void,
  onApprove: (record: PurchaseOrderItemRow) => void,
): TableColumnsType<PurchaseOrderItemRow> => [
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
  { title: 'Supplier', dataIndex: 'supplierName', key: 'supplierName', render: v => v ?? '—' },
  { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode', render: v => v ?? '—' },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  {
    title: 'Ordered',
    dataIndex: 'orderedQty',
    key: 'orderedQty',
    align: 'right' as const,
    width: 90,
  },
  {
    title: 'Received',
    dataIndex: 'receivedQty',
    key: 'receivedQty',
    align: 'right' as const,
    width: 90,
  },
  {
    title: 'Pending',
    dataIndex: 'pendingQty',
    key: 'pendingQty',
    align: 'right' as const,
    width: 90,
  },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
  {
    title: 'Source',
    key: 'source',
    width: 100,
    render: (_, r) => (r.fromEnquiry ? 'From Enquiry' : 'Direct'),
  },
  {
    title: 'Line Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    align: 'right' as const,
    render: v => v.toFixed(2),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => (
      <StatusBadge
        status={PO_STATUS_BADGE[status as PurchaseOrderItemRow['status']]}
        label={PO_STATUS_LABELS[status as PurchaseOrderItemRow['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 80,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="View PO">
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
        {record.status === 'PENDING_APPROVAL' && (
          <>
            <Tooltip title="Edit PO">
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
            <Tooltip title="Approve PO">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  onApprove(record)
                }}
              />
            </Tooltip>
          </>
        )}
      </Space>
    ),
  },
]

export const PurchaseOrderList: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { mutateAsync: approveOrder } = useApprovePurchaseOrder()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const filters = useProcurementFilters('order')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)
  // Status is filtered server-side; search only narrows the loaded page.
  const {
    data: items,
    meta,
    isLoading,
    isFetching,
  } = usePurchaseOrderItems({ page, perPage: pageSize, status: filters.status })

  const handleApprove = async (record: PurchaseOrderItemRow) => {
    try {
      await approveOrder(record.purchaseOrderId)
      message.success('Purchase order approved')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns = getColumns(
    record => navigate(`/purchase/orders/${record.purchaseOrderId}`),
    record => setDrawerState({ mode: 'edit', id: record.purchaseOrderId }),
    handleApprove,
  )

  const filtered = items.filter(
    row => !filters.search || row.poNumber.toLowerCase().includes(filters.search.toLowerCase()),
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Purchase Orders"
        subtitle={`${meta?.total ?? 0} purchase order items`}
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
              onChange={v => {
                setFilter('order', 'status', v ?? null)
                setPage(1)
              }}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button
              onClick={() => {
                resetFilters('order')
                setPage(1)
              }}
            >
              Clear filters
            </Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<PurchaseOrderItemRow>
          columns={columns}
          dataSource={filtered}
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
          totalLabel="purchase order items"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/purchase/orders/${record.purchaseOrderId}`),
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

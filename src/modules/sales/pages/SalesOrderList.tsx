import {
  CarOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesOrder } from '@/types/sales'
import { DeliveryChallanFormDrawer } from '../components/DeliveryChallanFormDrawer'
import { SalesOrderFormDrawer } from '../components/SalesOrderFormDrawer'
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from '../constants'
import { useDeleteSalesOrder, useSalesOrderAction, useSalesOrders } from '../hooks/useSalesOrders'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface RowActions {
  onView: (record: SalesOrder) => void
  onEdit: (record: SalesOrder) => void
  onApprove: (record: SalesOrder) => void
  onCancel: (record: SalesOrder) => void
  onCreateChallan: (record: SalesOrder) => void
  onDelete: (record: SalesOrder) => void
}

const action = (title: string, icon: ReactNode, onClick: () => void, danger = false) => (
  <Tooltip title={title} key={title}>
    <Button type="text" size="small" danger={danger} icon={icon} onClick={onClick} />
  </Tooltip>
)

const getColumns = (a: RowActions): TableColumnsType<SalesOrder> => [
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
    width: 220,
    render: (_, record) => {
      const isDraft = record.status === 'DRAFT'
      const isFinished = record.status === 'CLOSED' || record.status === 'CANCELLED'
      return (
        <Space size="small" onClick={e => e.stopPropagation()}>
          {action('View', <EyeOutlined />, () => a.onView(record))}
          {/* Backend only permits edits/deletes while the order is still a draft. */}
          {isDraft && action('Edit', <EditOutlined />, () => a.onEdit(record))}
          {isDraft && action('Approve', <CheckOutlined />, () => a.onApprove(record))}
          {!isFinished && action('Cancel Order', <StopOutlined />, () => a.onCancel(record), true)}
          {record.status === 'CONFIRMED' &&
            action('Create Delivery Challan', <CarOutlined />, () => a.onCreateChallan(record))}
          {isDraft && action('Delete', <DeleteOutlined />, () => a.onDelete(record), true)}
        </Space>
      )
    },
  },
]

export const SalesOrderList: FC = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const status = useSalesStatusFilter('order')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const [challanOrderId, setChallanOrderId] = useState<string>()

  const {
    data: orders,
    meta,
    isLoading,
    isFetching,
  } = useSalesOrders({ page, perPage: pageSize, status })
  const { mutateAsync: runAction } = useSalesOrderAction()
  const { mutateAsync: removeOrder } = useDeleteSalesOrder()

  // Status filtering happens server-side, so changing it has to send the
  // user back to page 1 — otherwise they can sit on a page number that
  // no longer exists in the filtered result set.
  const handleStatusChange = (value: string | null) => {
    setStatus('order', value ?? null)
    setPage(1)
  }

  const handleApprove = (record: SalesOrder) => {
    modal.confirm({
      title: 'Approve this sales order?',
      content: 'Once confirmed, the order can no longer be edited.',
      okText: 'Approve',
      onOk: async () => {
        try {
          await runAction({ id: record.id, action: 'approve' })
          message.success('Sales order approved')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleCancel = (record: SalesOrder) => {
    // Plain object, not a ref — this closure is handed to getColumns during
    // render, and the react-hooks/refs rule flags a ref read reachable from there.
    const reason = { value: '' }
    modal.confirm({
      title: 'Cancel this sales order?',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Reason (optional)"
          onChange={e => {
            reason.value = e.target.value
          }}
        />
      ),
      okText: 'Cancel Order',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await runAction({
            id: record.id,
            action: 'cancel',
            reason: reason.value || null,
          })
          message.success('Sales order cancelled')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleDelete = (record: SalesOrder) => {
    modal.confirm({
      title: `Delete ${record.orderNumber}?`,
      content: 'This permanently removes the sales order and its items.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeOrder(record.id)
          message.success('Sales order deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns({
    onView: record => navigate(`/sales/orders/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onApprove: handleApprove,
    onCancel: handleCancel,
    onCreateChallan: record => setChallanOrderId(record.id),
    onDelete: handleDelete,
  })

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
            onClick={() => setDrawerState({ mode: 'add' })}
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

      <SalesOrderFormDrawer
        open={!!drawerState}
        orderId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />

      <DeliveryChallanFormDrawer
        open={!!challanOrderId}
        salesOrderId={challanOrderId}
        onClose={() => setChallanOrderId(undefined)}
      />
    </div>
  )
}

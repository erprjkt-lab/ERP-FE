import {
  CarOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui'
import type { SalesOrderItemRow, SalesOrderStatus } from '@/types/sales'
import { DeliveryChallanFormDrawer } from '../components/DeliveryChallanFormDrawer'
import { SalesOrderFormDrawer } from '../components/SalesOrderFormDrawer'
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from '../constants'
import {
  useDeleteSalesOrder,
  useSalesOrderAction,
  useSalesOrderItems,
} from '../hooks/useSalesOrders'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface RowActions {
  onView: (record: SalesOrderItemRow) => void
  onEdit: (record: SalesOrderItemRow) => void
  onApprove: (record: SalesOrderItemRow) => void
  onCancel: (record: SalesOrderItemRow) => void
  onCreateChallan: (record: SalesOrderItemRow) => void
  onDelete: (record: SalesOrderItemRow) => void
}

const getColumns = (): TableColumnsType<SalesOrderItemRow> => [
  { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', width: 150 },
  { title: 'Date', dataIndex: 'orderDate', key: 'orderDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode', render: v => v ?? '—' },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 90, align: 'right' },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
  {
    title: 'Rate',
    dataIndex: 'rate',
    key: 'rate',
    width: 110,
    align: 'right',
    render: v => v.toFixed(2),
  },
  {
    title: 'Line Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    width: 120,
    align: 'right',
    render: v => v.toFixed(2),
  },
  {
    title: 'Source',
    key: 'source',
    width: 130,
    render: (_, r) => (r.fromQuotation ? 'From Quotation' : 'Direct'),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={ORDER_STATUS_BADGE[status as SalesOrderStatus]}
        label={ORDER_STATUS_LABELS[status as SalesOrderStatus]}
      />
    ),
  },
]

const getOrderActions = (record: SalesOrderItemRow, a: RowActions): TableActionItem[] => {
  const isDraft = record.status === 'DRAFT'
  const isFinished = record.status === 'CLOSED' || record.status === 'CANCELLED'
  const actions: TableActionItem[] = [
    {
      key: 'view',
      label: 'View',
      icon: <EyeOutlined />,
      variant: 'default',
      onClick: () => a.onView(record),
    },
  ]

  if (isDraft) {
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
    )
  }

  if (!isFinished) {
    actions.push({
      key: 'cancel',
      label: 'Cancel Order',
      icon: <StopOutlined />,
      variant: 'danger',
      danger: true,
      onClick: () => a.onCancel(record),
    })
  }

  if (record.status === 'CONFIRMED') {
    actions.push({
      key: 'create-challan',
      label: 'Create Delivery Challan',
      icon: <CarOutlined />,
      variant: 'accent',
      onClick: () => a.onCreateChallan(record),
    })
  }

  if (isDraft) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      variant: 'danger',
      danger: true,
      onClick: () => a.onDelete(record),
    })
  }

  return actions
}

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
    data: orderItems,
    meta,
    isLoading,
    isFetching,
  } = useSalesOrderItems({ page, perPage: pageSize, status })
  const { mutateAsync: runAction } = useSalesOrderAction()
  const { mutateAsync: removeOrder } = useDeleteSalesOrder()

  // Status filtering happens server-side, so changing it has to send the
  // user back to page 1 — otherwise they can sit on a page number that
  // no longer exists in the filtered result set.
  const handleStatusChange = (value: string | null) => {
    setStatus('order', value ?? null)
    setPage(1)
  }

  const handleApprove = (record: SalesOrderItemRow) => {
    modal.confirm({
      title: 'Approve this sales order?',
      content: 'Once confirmed, the order can no longer be edited.',
      okText: 'Approve',
      onOk: async () => {
        try {
          await runAction({ id: record.salesOrderId, action: 'approve' })
          message.success('Sales order approved')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleCancel = (record: SalesOrderItemRow) => {
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
            id: record.salesOrderId,
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

  const handleDelete = (record: SalesOrderItemRow) => {
    modal.confirm({
      title: `Delete ${record.orderNumber}?`,
      content: 'This permanently removes the sales order and its items.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeOrder(record.salesOrderId)
          message.success('Sales order deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns()

  const rowActions: RowActions = {
    onView: record => navigate(`/sales/orders/${record.salesOrderId}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.salesOrderId }),
    onApprove: handleApprove,
    onCancel: handleCancel,
    onCreateChallan: record => setChallanOrderId(record.salesOrderId),
    onDelete: handleDelete,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Orders"
        subtitle={`${meta?.total ?? 0} sales order items`}
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
        <DataTable<SalesOrderItemRow>
          columns={columns}
          dataSource={orderItems}
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
          totalLabel="sales order items"
          fillHeight
          rowActions={record => getOrderActions(record, rowActions)}
          onRow={record => ({
            onClick: () => navigate(`/sales/orders/${record.salesOrderId}`),
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

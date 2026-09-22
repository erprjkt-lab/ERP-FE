import {
  ArrowLeftOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Input, Row, Space, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesOrderItem } from '@/types/sales'
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from '../constants'
import { useDeleteSalesOrder, useSalesOrder, useSalesOrderAction } from '../hooks/useSalesOrders'
import { getErrorMessage } from '@/api/client'

const ITEM_COLUMNS: TableColumnsType<SalesOrderItem> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, r) => (r.itemCode ? `${r.itemCode} — ${r.itemName}` : (r.itemName ?? r.itemId)),
  },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 90 },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 90, render: v => v ?? '—' },
  { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 100 },
  {
    // Only differs from rate when the order overrode the quoted price, so it
    // doubles as the audit trail for that override.
    title: 'Quoted Rate',
    dataIndex: 'quotedRate',
    key: 'quotedRate',
    width: 110,
    render: v => v ?? '—',
  },
  { title: 'Disc %', dataIndex: 'discountPercent', key: 'discountPercent', width: 90 },
  { title: 'Tax %', dataIndex: 'taxPercent', key: 'taxPercent', width: 90 },
  {
    title: 'Line Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    width: 120,
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Committed Date',
    dataIndex: 'committedDate',
    key: 'committedDate',
    width: 140,
    render: v => v || '—',
  },
]

export const SalesOrderDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: order, isLoading } = useSalesOrder(id)
  const { mutateAsync: runAction, isPending } = useSalesOrderAction()
  const { mutateAsync: removeOrder, isPending: deleting } = useDeleteSalesOrder()
  const cancelReason = useRef('')

  if (!order) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/orders')}>
          Back to Sales Orders
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Sales order not found.'}</p>
      </div>
    )
  }

  const isDraft = order.status === 'DRAFT'
  const isFinished = order.status === 'CLOSED' || order.status === 'CANCELLED'

  const handleApprove = () => {
    modal.confirm({
      title: 'Approve this sales order?',
      content: 'Once confirmed, the order can no longer be edited.',
      okText: 'Approve',
      onOk: async () => {
        try {
          await runAction({ id: order.id, action: 'approve' })
          message.success('Sales order approved')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleCancel = () => {
    cancelReason.current = ''
    modal.confirm({
      title: 'Cancel this sales order?',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Reason (optional)"
          onChange={e => {
            cancelReason.current = e.target.value
          }}
        />
      ),
      okText: 'Cancel Order',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await runAction({
            id: order.id,
            action: 'cancel',
            reason: cancelReason.current || null,
          })
          message.success('Sales order cancelled')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleDelete = () => {
    modal.confirm({
      title: `Delete ${order.orderNumber}?`,
      content: 'This permanently removes the sales order and its items.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeOrder(order.id)
          message.success('Sales order deleted')
          navigate('/sales/orders')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  return (
    <div>
      <PageHeader
        title={order.orderNumber}
        subtitle={ORDER_STATUS_LABELS[order.status]}
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Sales Order', href: '/sales/orders' },
          { label: order.orderNumber },
        ]}
        actions={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/orders')}>
              Back
            </Button>
            {/* Backend only permits edits while the order is still a draft. */}
            <Button
              icon={<EditOutlined />}
              disabled={!isDraft}
              onClick={() => navigate(`/sales/orders/${order.id}/edit`)}
            >
              Edit
            </Button>
            <Button
              type={isDraft ? 'primary' : 'default'}
              icon={<CheckOutlined />}
              disabled={!isDraft}
              loading={isPending}
              onClick={handleApprove}
            >
              Approve
            </Button>
            <Button danger icon={<StopOutlined />} disabled={isFinished} onClick={handleCancel}>
              Cancel Order
            </Button>
            {/* Backend only permits deletion while still a draft. */}
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!isDraft}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="Status">
                <StatusBadge
                  status={ORDER_STATUS_BADGE[order.status]}
                  label={ORDER_STATUS_LABELS[order.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">{order.orderDate}</Descriptions.Item>
              <Descriptions.Item label="Customer">
                {order.partyName ?? order.partyId}
              </Descriptions.Item>
              <Descriptions.Item label="Customer PO No">
                {order.customerPoNo || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Customer PO Date">
                {order.customerPoDate || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                {order.salesQuotationId ? (
                  <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={() => navigate(`/sales/quotations/${order.salesQuotationId}`)}
                  >
                    View Quotation
                  </Button>
                ) : (
                  'Direct'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN">{order.gstin || '—'}</Descriptions.Item>
              <Descriptions.Item label="Approved By">{order.approvedBy ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Net Amount">
                <Typography.Text strong>{order.netAmount.toFixed(2)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Remarks" span={3}>
                {order.remarks || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title={
              <Typography.Title level={5} style={{ margin: 0 }}>
                Items
              </Typography.Title>
            }
          >
            <DataTable<SalesOrderItem>
              columns={ITEM_COLUMNS}
              dataSource={order.items}
              rowKey="id"
              pagination={false}
              size="small"
              totalLabel="items"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

import { ArrowLeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Select, Space, Table, Typography } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PurchaseOrder, PurchaseOrderItem } from '@/types/procurement'
import { PO_STATUS_BADGE, PO_STATUS_LABELS } from '../constants'
import { usePurchaseEnquiries } from '../hooks/usePurchaseEnquiries'
import { usePurchaseOrder, useUpdatePurchaseOrderStatus } from '../hooks/usePurchaseOrders'

const NEXT_STATUS_OPTIONS: Record<PurchaseOrder['status'], PurchaseOrder['status'][]> = {
  DRAFT: ['APPROVED', 'CANCELLED'],
  APPROVED: ['SENT', 'CANCELLED'],
  SENT: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['RECEIVED', 'CLOSED'],
  RECEIVED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
}

export const PurchaseOrderDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { data: order, isLoading } = usePurchaseOrder(id)
  const { data: enquiries } = usePurchaseEnquiries()
  const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdatePurchaseOrderStatus()

  if (!order) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/orders')}>
          Back to Purchase Orders
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Purchase order not found.'}</p>
      </div>
    )
  }

  const sourceEnquiry = enquiries.find(e => e.id === order.purchaseEnquiryId)
  const nextStatuses = NEXT_STATUS_OPTIONS[order.status]

  const handleStatusChange = async (status: PurchaseOrder['status']) => {
    try {
      await updateStatus({ id: order.id, status })
      message.success(`Purchase order marked ${PO_STATUS_LABELS[status]}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const columns = [
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, r: PurchaseOrderItem) => r.itemName ?? r.itemId,
    },
    { title: 'Ordered Qty', dataIndex: 'orderedQty', key: 'orderedQty' },
    { title: 'UOM', dataIndex: 'uomName', key: 'uomName' },
    { title: 'Rate', dataIndex: 'rate', key: 'rate' },
    { title: 'Discount %', dataIndex: 'discountPercent', key: 'discountPercent' },
    { title: 'Tax %', dataIndex: 'taxPercent', key: 'taxPercent' },
    { title: 'Line Total', dataIndex: 'lineTotal', key: 'lineTotal' },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (v: string) => v ?? '—',
    },
  ]

  return (
    <div>
      <PageHeader
        title={order.poNumber}
        subtitle={PO_STATUS_LABELS[order.status]}
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'Purchase Order', href: '/purchase/orders' },
          { label: order.poNumber },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/orders')}>
              Back
            </Button>
            {sourceEnquiry && (
              <Button onClick={() => navigate(`/purchase/enquiries/${sourceEnquiry.id}`)}>
                View Source Enquiry
              </Button>
            )}
            {nextStatuses.length > 0 && (
              <Select
                placeholder="Change status"
                style={{ width: 180 }}
                loading={updatingStatus}
                options={nextStatuses.map(status => ({
                  label: PO_STATUS_LABELS[status],
                  value: status,
                }))}
                onChange={handleStatusChange}
              />
            )}
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="Status">
                <StatusBadge
                  status={PO_STATUS_BADGE[order.status]}
                  label={PO_STATUS_LABELS[order.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="PO Date">{order.poDate}</Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {order.supplierName ?? order.supplierId}
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                {sourceEnquiry ? `Enquiry ${sourceEnquiry.enquiryNumber}` : 'Direct'}
              </Descriptions.Item>
              <Descriptions.Item label="Currency">{order.currency}</Descriptions.Item>
              <Descriptions.Item label="Created By">{order.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Payment Terms">
                {order.paymentTerms ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Terms">
                {order.deliveryTerms ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Remarks">{order.remarks ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Taxable Amount">
                {order.taxableAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Tax Amount">{order.taxAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Net Amount">
                <Typography.Text strong>
                  {order.currency} {order.netAmount.toFixed(2)}
                </Typography.Text>
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
            <Table
              columns={columns}
              dataSource={order.items}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

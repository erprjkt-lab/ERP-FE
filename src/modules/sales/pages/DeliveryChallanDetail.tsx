import {
  ArrowLeftOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Space, Table, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { downloadDeliveryChallanPdf } from '@/api/deliveryChallans'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { DeliveryChallanItem, StockLine } from '@/types/sales'
import { DetailFallback } from '../components/DetailFallback'
import { CHALLAN_STATUS_BADGE, CHALLAN_STATUS_LABELS } from '../constants'
import { useCancelDeliveryChallan, useDeliveryChallan } from '../hooks/useDeliveryChallans'

const STOCK_COLUMNS: TableColumnsType<StockLine> = [
  { title: 'Location', dataIndex: 'locationName', key: 'locationName', render: v => v ?? '—' },
  { title: 'Batch', dataIndex: 'batchNo', key: 'batchNo', render: v => v || '—' },
  { title: 'Heat', dataIndex: 'heatNo', key: 'heatNo', render: v => v || '—' },
  { title: 'Serial', dataIndex: 'serialNo', key: 'serialNo', render: v => v || '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 100 },
]

export const DeliveryChallanDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: challan, isLoading, error } = useDeliveryChallan(id)
  const { mutateAsync: cancelChallan, isPending: cancelling } = useCancelDeliveryChallan()
  const [downloading, setDownloading] = useState(false)

  if (!challan) {
    return (
      <DetailFallback
        isLoading={isLoading}
        error={error}
        backTo="/sales/delivery-challans"
        backLabel="Back to Delivery Challans"
        notFoundLabel="Delivery challan not found."
      />
    )
  }

  const isDispatched = challan.status === 'DISPATCHED'
  const hasBilledLines = challan.items.some(item => item.billedQty > 0)
  const unbilledQty = challan.items.reduce(
    (sum, item) => sum + Math.max(item.dispatchQty - item.billedQty, 0),
    0,
  )

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadDeliveryChallanPdf(Number(challan.id), challan.challanNumber)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not download the PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleCancel = () => {
    modal.confirm({
      title: `Cancel ${challan.challanNumber}?`,
      content: 'This reverses the stock movements and restores the pending quantity on the order.',
      okText: 'Cancel Challan',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelChallan(challan.id)
          message.success('Delivery challan cancelled')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const itemColumns: TableColumnsType<DeliveryChallanItem> = [
    {
      title: 'Item',
      key: 'item',
      render: (_, r) => (r.itemCode ? `${r.itemCode} — ${r.itemName}` : (r.itemName ?? r.itemId)),
    },
    {
      title: 'Source',
      key: 'source',
      width: 110,
      render: (_, r) => (r.salesOrderItemId ? 'Order line' : 'Direct'),
    },
    { title: 'Dispatched', dataIndex: 'dispatchQty', key: 'dispatchQty', width: 110 },
    { title: 'Billed', dataIndex: 'billedQty', key: 'billedQty', width: 90 },
    {
      title: 'Unbilled',
      key: 'unbilled',
      width: 100,
      render: (_, r) => Math.max(r.dispatchQty - r.billedQty, 0),
    },
    { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 90 },
    {
      title: 'Line Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 110,
      render: (value: number) => value.toFixed(2),
    },
  ]

  return (
    <div>
      <PageHeader
        title={challan.challanNumber}
        subtitle={CHALLAN_STATUS_LABELS[challan.status]}
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Delivery Challan', href: '/sales/delivery-challans' },
          { label: challan.challanNumber },
        ]}
        actions={
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/sales/delivery-challans')}
            >
              Back
            </Button>
            <Button icon={<FilePdfOutlined />} loading={downloading} onClick={handleDownload}>
              Download PDF
            </Button>
            <Button
              type="primary"
              icon={<FileDoneOutlined />}
              disabled={!isDispatched || unbilledQty <= 0}
              onClick={() => navigate(`/sales/invoices/new?challanId=${challan.id}`)}
            >
              Create Invoice
            </Button>
            {/* Backend refuses to cancel a challan that has been billed. */}
            <Button
              danger
              icon={<StopOutlined />}
              disabled={!isDispatched || hasBilledLines}
              loading={cancelling}
              onClick={handleCancel}
            >
              Cancel
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
                  status={CHALLAN_STATUS_BADGE[challan.status]}
                  label={CHALLAN_STATUS_LABELS[challan.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Challan Date">{challan.challanDate}</Descriptions.Item>
              <Descriptions.Item label="Customer">
                {challan.partyName ?? challan.partyId}
              </Descriptions.Item>
              <Descriptions.Item label="Vehicle No">{challan.vehicleNo || '—'}</Descriptions.Item>
              <Descriptions.Item label="LR No">{challan.lrNo || '—'}</Descriptions.Item>
              <Descriptions.Item label="LR Date">{challan.lrDate || '—'}</Descriptions.Item>
              <Descriptions.Item label="Transporter">
                {challan.transporterName || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN">{challan.gstin || '—'}</Descriptions.Item>
              <Descriptions.Item label="Net Amount">
                <Typography.Text strong>{challan.netAmount.toFixed(2)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Remarks" span={3}>
                {challan.remarks || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title={
              <Typography.Title level={5} style={{ margin: 0 }}>
                Dispatched Lines
              </Typography.Title>
            }
          >
            <DataTable<DeliveryChallanItem>
              columns={itemColumns}
              dataSource={challan.items}
              rowKey="id"
              pagination={false}
              size="small"
              totalLabel="lines"
              expandable={{
                expandedRowRender: item => (
                  <Table<StockLine>
                    columns={STOCK_COLUMNS}
                    dataSource={item.stocks}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ),
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

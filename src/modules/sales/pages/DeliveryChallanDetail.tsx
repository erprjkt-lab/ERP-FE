import { ArrowLeftOutlined, DownloadOutlined, StopOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Space, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { downloadDeliveryChallanPdf } from '@/api/deliveryChallans'
import { DataTable } from '@/components/ui/DataTable'
import { SUMMARY_PROPS } from '@/components/erp/detailSummary'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { DeliveryChallanItem, DeliveryChallanItemStock } from '@/types/sales'
import { CHALLAN_STATUS_BADGE, CHALLAN_STATUS_LABELS } from '../constants'
import { useCancelDeliveryChallan, useDeliveryChallan } from '../hooks/useDeliveryChallans'

const STOCK_COLUMNS: TableColumnsType<DeliveryChallanItemStock> = [
  {
    title: 'Location',
    dataIndex: 'locationName',
    key: 'locationName',
    render: (v, r) => v ?? r.locationId,
  },
  { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo' },
  { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo' },
  { title: 'Serial No', dataIndex: 'serialNo', key: 'serialNo' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
]

const getItemColumns = (
  onViewOrder: (orderId: string) => void,
): TableColumnsType<DeliveryChallanItem> => [
  {
    title: 'Item',
    key: 'item',
    render: (_, r) => (r.itemCode ? `${r.itemCode} — ${r.itemName}` : (r.itemName ?? r.itemId)),
  },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 90, render: v => v ?? '—' },
  {
    title: 'Dispatch Qty',
    dataIndex: 'dispatchQty',
    key: 'dispatchQty',
    align: 'right',
    width: 110,
  },
  { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 100 },
  {
    title: 'Order Rate',
    dataIndex: 'orderRate',
    key: 'orderRate',
    width: 100,
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
  { title: 'Billed Qty', dataIndex: 'billedQty', key: 'billedQty', width: 100, align: 'right' },
  {
    title: 'Sales Order',
    key: 'salesOrder',
    width: 120,
    render: (_, r) =>
      r.salesOrderId ? (
        <Button type="link" style={{ padding: 0 }} onClick={() => onViewOrder(r.salesOrderId!)}>
          View
        </Button>
      ) : (
        'Direct'
      ),
  },
]

export const DeliveryChallanDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: challan, isLoading } = useDeliveryChallan(id)
  const { mutateAsync: runCancel, isPending } = useCancelDeliveryChallan()
  const [downloading, setDownloading] = useState(false)

  if (!challan) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/delivery-challans')}>
          Back to Delivery Challans
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Delivery challan not found.'}</p>
      </div>
    )
  }

  const isDispatched = challan.status === 'DISPATCHED'

  const handleCancel = () => {
    modal.confirm({
      title: `Cancel ${challan.challanNumber}?`,
      content:
        'This reverses the stock dispatched on this challan and restores the pending quantity on its sales order. Only allowed while nothing on it has been billed.',
      okText: 'Cancel Challan',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await runCancel(challan.id)
          message.success('Delivery challan cancelled')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadDeliveryChallanPdf(Number(challan.id), challan.challanNumber)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setDownloading(false)
    }
  }

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
            <Button icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
              Download PDF
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              disabled={!isDispatched}
              loading={isPending}
              onClick={handleCancel}
            >
              Cancel Challan
            </Button>
          </Space>
        }
      />

      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card>
            <Descriptions {...SUMMARY_PROPS}>
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
              <Descriptions.Item label="Remarks" span="filled">
                {challan.remarks || '—'}
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
            <DataTable<DeliveryChallanItem>
              columns={getItemColumns(orderId => navigate(`/sales/orders/${orderId}`))}
              dataSource={challan.items}
              rowKey="id"
              pagination={false}
              size="small"
              totalLabel="items"
              expandable={{
                expandedRowRender: item => (
                  <DataTable<DeliveryChallanItemStock>
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

import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Input, Row, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StockAdjustmentItem } from '@/types/inventory'
import { STOCK_ADJUSTMENT_STATUS_BADGE, STOCK_ADJUSTMENT_STATUS_LABELS } from '../constants'
import {
  useApproveStockAdjustment,
  useCancelStockAdjustment,
  useStockAdjustment,
} from '../hooks/useStockAdjustments'
import { getErrorMessage } from '@/api/client'

export const StockAdjustmentDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: adjustment, isLoading } = useStockAdjustment(id)
  const { mutateAsync: approve, isPending: approving } = useApproveStockAdjustment()
  const { mutateAsync: cancel, isPending: cancelling } = useCancelStockAdjustment()

  if (!adjustment) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/adjustments')}>
          Back to Stock Adjustments
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Adjustment not found.'}</p>
      </div>
    )
  }

  const handleApprove = () => {
    modal.confirm({
      title: 'Approve this adjustment?',
      content:
        'This posts the variance to the stock ledger immediately and cannot be undone from here.',
      okText: 'Approve',
      onOk: async () => {
        try {
          await approve(adjustment.id)
          message.success('Stock adjustment approved and posted to the ledger')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleCancel = () => {
    let remarks = ''
    modal.confirm({
      title: 'Cancel this adjustment?',
      content: (
        <Input.TextArea
          placeholder="Reason (optional)"
          rows={3}
          onChange={e => {
            remarks = e.target.value
          }}
        />
      ),
      okText: 'Cancel Adjustment',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancel({ id: adjustment.id, remarks })
          message.success('Stock adjustment cancelled')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = [
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, r: StockAdjustmentItem) => r.itemName ?? r.itemId,
    },
    {
      title: 'Batch / Heat',
      key: 'batchHeat',
      render: (_: unknown, r: StockAdjustmentItem) => `${r.batchNo ?? '—'} / ${r.heatNo ?? '—'}`,
    },
    { title: 'System Qty', dataIndex: 'systemQty', key: 'systemQty', align: 'right' as const },
    {
      title: 'Physical Qty',
      dataIndex: 'physicalQty',
      key: 'physicalQty',
      align: 'right' as const,
    },
    {
      title: 'Variance',
      dataIndex: 'varianceQty',
      key: 'varianceQty',
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : undefined, fontWeight: 500 }}>
          {v > 0 ? `+${v}` : v}
        </span>
      ),
    },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', render: (v: string) => v ?? '—' },
  ]

  return (
    <div>
      <PageHeader
        title={adjustment.adjustmentNumber}
        subtitle={STOCK_ADJUSTMENT_STATUS_LABELS[adjustment.status]}
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Adjustments', href: '/inventory/adjustments' },
          { label: adjustment.adjustmentNumber },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/adjustments')}>
              Back
            </Button>
            {adjustment.status === 'DRAFT' && (
              <>
                <Button danger icon={<CloseOutlined />} loading={cancelling} onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={approving}
                  onClick={handleApprove}
                >
                  Approve
                </Button>
              </>
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
                  status={STOCK_ADJUSTMENT_STATUS_BADGE[adjustment.status]}
                  label={STOCK_ADJUSTMENT_STATUS_LABELS[adjustment.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Adjustment Date">
                {adjustment.adjustmentDate}
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                {adjustment.locationName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Reason">{adjustment.reason}</Descriptions.Item>
              <Descriptions.Item label="Approved By">
                {adjustment.approvedBy ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Approved At">
                {adjustment.approvedAt ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Remarks" span={3}>
                {adjustment.remarks ?? '—'}
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
            <DataTable
              columns={columns}
              dataSource={adjustment.items}
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

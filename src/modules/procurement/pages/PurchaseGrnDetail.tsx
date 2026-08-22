import { ArrowLeftOutlined, StopOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { GrnItem } from '@/types/procurement'
import {
  GRN_LINE_STATUS_BADGE,
  GRN_LINE_STATUS_LABELS,
  GRN_STATUS_BADGE,
  GRN_STATUS_LABELS,
} from '../constants'
import { useCancelGrn, useGrn, useSaveGrnItemQc } from '../hooks/usePurchaseGrns'

const QC_LOCKED_STATUSES = new Set([2, 3, 4]) // QC Done | Stock Posted | Cancelled

export const PurchaseGrnDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: grn, isLoading } = useGrn(id)
  const { mutateAsync: cancelGrnMutation, isPending: cancelling } = useCancelGrn()
  const [qcItem, setQcItem] = useState<GrnItem | null>(null)

  if (!grn) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/grn')}>
          Back to GRNs
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'GRN not found.'}</p>
      </div>
    )
  }

  const handleCancel = () => {
    modal.confirm({
      title: 'Cancel this GRN?',
      content:
        'This reverses any posted stock and the PO received quantity. This cannot be undone.',
      okText: 'Cancel GRN',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelGrnMutation(grn.id)
          message.success('GRN cancelled')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const columns = [
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, r: GrnItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.itemName ?? r.itemId}</div>
          {r.itemCode && (
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{r.itemCode}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Ordered Qty',
      dataIndex: 'orderedQty',
      key: 'orderedQty',
      render: (v?: number) => v ?? '—',
    },
    { title: 'Received Qty', dataIndex: 'receivedQty', key: 'receivedQty' },
    {
      title: 'Batch / Heat / Serial',
      key: 'tracking',
      render: (_: unknown, r: GrnItem) => (
        <Typography.Text style={{ fontSize: 12 }}>
          {r.batchNo ?? '—'} / {r.heatNo ?? '—'} / {r.serialNo ?? '—'}
        </Typography.Text>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'locationName',
      key: 'locationName',
      render: (v: string | undefined, r: GrnItem) => v ?? r.locationId,
    },
    {
      title: 'Accepted',
      dataIndex: 'acceptedQty',
      key: 'acceptedQty',
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'Rejected',
      dataIndex: 'rejectedQty',
      key: 'rejectedQty',
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'Short',
      dataIndex: 'shortQty',
      key: 'shortQty',
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'Line Status',
      dataIndex: 'lineStatus',
      key: 'lineStatus',
      render: (status: GrnItem['lineStatus']) => (
        <StatusBadge
          status={GRN_LINE_STATUS_BADGE[status]}
          label={GRN_LINE_STATUS_LABELS[status]}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, r: GrnItem) => (
        <Tooltip title={QC_LOCKED_STATUSES.has(r.lineStatus) ? 'QC already recorded' : 'Run QC'}>
          <Button
            size="small"
            disabled={QC_LOCKED_STATUSES.has(r.lineStatus)}
            onClick={() => setQcItem(r)}
          >
            QC
          </Button>
        </Tooltip>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={grn.grnNo}
        subtitle={GRN_STATUS_LABELS[grn.status]}
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'GRN', href: '/purchase/grn' },
          { label: grn.grnNo },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/grn')}>
              Back
            </Button>
            {grn.status !== 4 && (
              <Button danger icon={<StopOutlined />} loading={cancelling} onClick={handleCancel}>
                Cancel GRN
              </Button>
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
                  status={GRN_STATUS_BADGE[grn.status]}
                  label={GRN_STATUS_LABELS[grn.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="GRN Date">{grn.grnDate}</Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {grn.supplierName ?? grn.supplierId}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier Doc No">
                {grn.supplierDocNo ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier Doc Date">
                {grn.supplierDocDate ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">{grn.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Remarks" span={3}>
                {grn.remarks ?? '—'}
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
              dataSource={grn.items}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      {qcItem && <QcModal item={qcItem} grnId={grn.id} onClose={() => setQcItem(null)} />}
    </div>
  )
}

interface QcModalProps {
  item: GrnItem
  grnId: string
  onClose: () => void
}

interface QcFormValues {
  acceptedQty?: number
  rejectedQty?: number
  shortQty?: number
  heatVerified?: boolean
  remark?: string
}

const QcModal: FC<QcModalProps> = ({ item, grnId, onClose }) => {
  const [form] = Form.useForm<QcFormValues>()
  const { message } = App.useApp()
  const { mutateAsync: saveQc, isPending } = useSaveGrnItemQc()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const accepted = values.acceptedQty ?? 0
      const rejected = values.rejectedQty ?? 0
      const short = values.shortQty ?? 0
      if (accepted + rejected + short > item.receivedQty) {
        message.error('Accepted + rejected + short quantity cannot exceed received quantity')
        return
      }
      await saveQc({
        grnItemId: item.id,
        grnId,
        payload: {
          accepted_qty: values.acceptedQty ?? null,
          rejected_qty: values.rejectedQty ?? null,
          short_qty: values.shortQty ?? null,
          heat_verified: values.heatVerified ?? null,
          remark: values.remark,
        },
      })
      message.success('QC result saved')
      onClose()
    } catch (error) {
      if (error instanceof Error) message.error(error.message)
    }
  }

  return (
    <Modal
      title={`QC — ${item.itemName ?? item.itemId}`}
      open
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={isPending}
      okText="Save QC Result"
    >
      <Typography.Text type="secondary">Received Qty: {item.receivedQty}</Typography.Text>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Accepted Qty" name="acceptedQty">
          <InputNumber min={0} max={item.receivedQty} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Rejected Qty" name="rejectedQty">
          <InputNumber min={0} max={item.receivedQty} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Short Qty" name="shortQty">
          <InputNumber min={0} max={item.receivedQty} style={{ width: '100%' }} />
        </Form.Item>
        {item.heatNo && item.heatNo !== 'NA' && (
          <Form.Item label="Heat Verified" name="heatVerified" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        )}
        <Form.Item label="Remarks" name="remark">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

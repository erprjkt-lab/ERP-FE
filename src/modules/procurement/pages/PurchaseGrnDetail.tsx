import { ArrowLeftOutlined, EditOutlined, StopOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Skeleton,
  Space,
  Tooltip,
  Typography,
} from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePagePermission } from '@/hooks/usePagePermission'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { SUMMARY_PROPS } from '@/components/erp/detailSummary'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { IncomingInspectionDrawer } from '@/modules/quality/components/IncomingInspectionDrawer'
import type { GrnItem } from '@/types/procurement'
import { GrnFormDrawer } from '../components/GrnFormDrawer'
import { GrnQcModal } from '../components/GrnQcModal'
import {
  GRN_LINE_STATUS_BADGE,
  GRN_LINE_STATUS_LABELS,
  GRN_STATUS_BADGE,
  GRN_STATUS_LABELS,
  ITEM_TYPE_RAW_MATERIAL,
  QC_LOCKED_STATUSES,
} from '../constants'
import { useCancelGrn, useGrn } from '../hooks/usePurchaseGrns'
import { formatDateTime } from '@/utils/date'

export const PurchaseGrnDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { canModify } = usePagePermission()
  const { data: grn, isLoading } = useGrn(id)
  const { mutateAsync: cancelGrnMutation, isPending: cancelling } = useCancelGrn()
  const [qcItem, setQcItem] = useState<GrnItem | null>(null)
  const [iirItem, setIirItem] = useState<GrnItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  if (!grn) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/grn')}>
          Back to GRNs
        </Button>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 24 }} />
        ) : (
          <p style={{ marginTop: 24 }}>GRN not found.</p>
        )}
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
          message.error(getErrorMessage(error))
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
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      align: 'right' as const,
      render: (v: number | null) => (v != null ? `₹${v.toFixed(2)}` : '—'),
    },
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
        <GrnLineActions record={r} onQc={() => setQcItem(r)} onIir={() => setIirItem(r)} />
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
            {canModify && (
              <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}
            {grn.status !== 4 && canModify && (
              <Button danger icon={<StopOutlined />} loading={cancelling} onClick={handleCancel}>
                Cancel GRN
              </Button>
            )}
          </Space>
        }
      />

      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card>
            <Descriptions {...SUMMARY_PROPS}>
              <Descriptions.Item label="Status">
                <StatusBadge
                  status={GRN_STATUS_BADGE[grn.status]}
                  label={GRN_STATUS_LABELS[grn.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="GRN Date">{formatDateTime(grn.grnDate)}</Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {grn.supplierName ?? grn.supplierId}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier Doc No">
                {grn.supplierDocNo ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier Doc Date">
                {formatDateTime(grn.supplierDocDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">{grn.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Remarks" span="filled">
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
            <DataTable
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

      {qcItem && <GrnQcModal line={qcItem} onClose={() => setQcItem(null)} />}
      <IncomingInspectionDrawer
        open={!!iirItem}
        grnItemId={iirItem?.id}
        itemId={iirItem?.itemId}
        itemName={iirItem?.itemName ?? iirItem?.itemId}
        grnNo={grn.grnNo}
        onClose={() => setIirItem(null)}
      />
      <GrnFormDrawer open={editOpen} grnId={grn.id} onClose={() => setEditOpen(false)} />
    </div>
  )
}

interface GrnLineActionsProps {
  record: GrnItem
  onQc: () => void
  onIir: () => void
}

const GrnLineActions: FC<GrnLineActionsProps> = ({ record, onQc, onIir }) => {
  const isRawMaterial = record.itemType === ITEM_TYPE_RAW_MATERIAL
  const qcLocked = QC_LOCKED_STATUSES.has(record.lineStatus)
  // The GRN response says per line whether an approved IIR exists, so this no
  // longer costs a request per raw-material row — and the flag arrives with the
  // row, so the button can never flash enabled while a check is still running.
  const qcBlockedByIir = isRawMaterial && !record.hasApprovedInspectionReport

  const qcTooltip = qcLocked
    ? 'QC already recorded'
    : qcBlockedByIir
      ? 'An approved Incoming Inspection Report (IIR) is required first'
      : 'Run QC'

  return (
    <Space size="small">
      {isRawMaterial && (
        <Tooltip title="Manage Incoming Inspection Reports for this line">
          <Button size="small" onClick={onIir}>
            IIR{record.hasApprovedInspectionReport ? ' ✓' : ''}
          </Button>
        </Tooltip>
      )}
      <Tooltip title={qcTooltip}>
        <Button size="small" disabled={qcLocked || qcBlockedByIir} onClick={onQc}>
          QC
        </Button>
      </Tooltip>
    </Space>
  )
}

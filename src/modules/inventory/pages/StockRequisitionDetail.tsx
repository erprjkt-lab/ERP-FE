import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  SendOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from 'antd'
import type { FormListFieldData } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockIssue, StockRequisitionItem } from '@/types/inventory'
import { STOCK_REQUISITION_STATUS_BADGE, STOCK_REQUISITION_STATUS_LABELS } from '../constants'
import { useLocations } from '../hooks/useLocations'
import { useIssueAgainstRequisition, useStockIssuesForRequisition } from '../hooks/useStockIssues'
import {
  useApproveStockRequisition,
  useCancelStockRequisition,
  useCloseStockRequisition,
  useRejectStockRequisition,
  useStockRequisition,
  useSubmitStockRequisition,
} from '../hooks/useStockRequisitions'
import { getErrorMessage } from '@/api/client'

interface IssueLineValues {
  stockRequisitionItemId: string
  storeLocationId: string
  batchNo?: string
  heatNo?: string
  issuedQty: number
}

export const StockRequisitionDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: requisition, isLoading } = useStockRequisition(id)
  const { data: issues } = useStockIssuesForRequisition(id)
  const { mutateAsync: submitForApproval, isPending: submitting } = useSubmitStockRequisition()
  const { mutateAsync: approve, isPending: approving } = useApproveStockRequisition()
  const { mutateAsync: reject, isPending: rejecting } = useRejectStockRequisition()
  const { mutateAsync: close, isPending: closing } = useCloseStockRequisition()
  const { mutateAsync: cancel, isPending: cancelling } = useCancelStockRequisition()
  const [issueModalOpen, setIssueModalOpen] = useState(false)

  if (!requisition) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/requisitions')}>
          Back to Stock Requisitions
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Requisition not found.'}</p>
      </div>
    )
  }

  const handleSubmit = async () => {
    try {
      await submitForApproval(requisition.id)
      message.success('Requisition submitted for approval')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleApprove = async () => {
    try {
      await approve(requisition.id)
      message.success('Requisition approved')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleReject = () => {
    let remarks = ''
    modal.confirm({
      title: 'Reject this requisition?',
      content: (
        <Input.TextArea
          placeholder="Reason for rejection"
          rows={3}
          onChange={e => {
            remarks = e.target.value
          }}
        />
      ),
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reject({ id: requisition.id, remarks })
          message.success('Requisition rejected')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleClose = () => {
    modal.confirm({
      title: 'Close this requisition?',
      content: 'Any items with pending quantity will no longer be issuable.',
      okText: 'Close',
      onOk: async () => {
        try {
          await close(requisition.id)
          message.success('Requisition closed')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleCancel = () => {
    let remarks = ''
    modal.confirm({
      title: 'Cancel this requisition?',
      content: (
        <Input.TextArea
          placeholder="Reason (optional)"
          rows={3}
          onChange={e => {
            remarks = e.target.value
          }}
        />
      ),
      okText: 'Cancel Requisition',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancel({ id: requisition.id, remarks })
          message.success('Requisition cancelled')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const itemColumns = [
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, r: StockRequisitionItem) => r.itemName ?? r.itemId,
    },
    { title: 'Required Qty', dataIndex: 'requiredQty', key: 'requiredQty' },
    { title: 'UOM', dataIndex: 'uomName', key: 'uomName' },
    { title: 'Pending Qty', dataIndex: 'pendingQty', key: 'pendingQty' },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', render: (v: string) => v ?? '—' },
  ]

  const issueColumns = [
    { title: 'Item', dataIndex: 'itemName', key: 'itemName', render: (v: string) => v ?? '—' },
    {
      title: 'Location',
      dataIndex: 'storeLocationName',
      key: 'storeLocationName',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'Batch / Heat',
      key: 'batchHeat',
      render: (_: unknown, r: StockIssue) => `${r.batchNo ?? '—'} / ${r.heatNo ?? '—'}`,
    },
    { title: 'Issued Qty', dataIndex: 'issuedQty', key: 'issuedQty' },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (v: string) => v ?? '—',
    },
  ]

  const hasPendingItems = requisition.items.some(item => item.pendingQty > 0)

  return (
    <div>
      <PageHeader
        title={requisition.requisitionNumber}
        subtitle={STOCK_REQUISITION_STATUS_LABELS[requisition.status]}
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Requisitions', href: '/inventory/requisitions' },
          { label: requisition.requisitionNumber },
        ]}
        actions={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/inventory/requisitions')}
            >
              Back
            </Button>
            {requisition.status === 'DRAFT' && (
              <>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={cancelling}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/inventory/requisitions/${requisition.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  Submit for Approval
                </Button>
              </>
            )}
            {requisition.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={cancelling}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button danger icon={<CloseOutlined />} loading={rejecting} onClick={handleReject}>
                  Reject
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
            {requisition.status === 'APPROVED' && (
              <>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={cancelling}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button loading={closing} onClick={handleClose}>
                  Close
                </Button>
                <Button
                  type="primary"
                  icon={<InboxOutlined />}
                  disabled={!hasPendingItems}
                  onClick={() => setIssueModalOpen(true)}
                >
                  Issue Stock
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
                  status={STOCK_REQUISITION_STATUS_BADGE[requisition.status]}
                  label={STOCK_REQUISITION_STATUS_LABELS[requisition.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Requisition Date">
                {requisition.requisitionDate}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">{requisition.priority}</Descriptions.Item>
              <Descriptions.Item label="Department">
                {requisition.departmentName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Requested By">
                {requisition.requestedByName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Approved By">
                {requisition.approvedBy ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Remarks" span={3}>
                {requisition.remarks ?? '—'}
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
              columns={itemColumns}
              dataSource={requisition.items}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        {issues.length > 0 && (
          <Col span={24}>
            <Card
              title={
                <Typography.Title level={5} style={{ margin: 0 }}>
                  Issue History
                </Typography.Title>
              }
            >
              <DataTable
                columns={issueColumns}
                dataSource={issues}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        )}
      </Row>

      {issueModalOpen && (
        <IssueStockModal
          requisitionId={requisition.id}
          items={requisition.items.filter(item => item.pendingQty > 0)}
          onClose={() => setIssueModalOpen(false)}
        />
      )}
    </div>
  )
}

interface IssueStockModalProps {
  requisitionId: string
  items: StockRequisitionItem[]
  onClose: () => void
}

const IssueStockModal: FC<IssueStockModalProps> = ({ requisitionId, items, onClose }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data: locations } = useLocations()
  const { data: procurementItems } = useProcurementItems()
  const { mutateAsync: issueStock, isPending } = useIssueAgainstRequisition(requisitionId)

  const itemOptions = items.map(item => ({
    label: `${item.itemName ?? item.itemId} (pending: ${item.pendingQty})`,
    value: item.id,
  }))
  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }))

  const handleFinish = async (values: { issueDate?: dayjs.Dayjs; lines: IssueLineValues[] }) => {
    try {
      await issueStock({
        issue_date: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : undefined,
        lines: values.lines.map(line => ({
          stock_requisition_item_id: Number(line.stockRequisitionItemId),
          store_location_id: Number(line.storeLocationId),
          batch_no: line.batchNo ?? null,
          heat_no: line.heatNo ?? null,
          issued_qty: line.issuedQty,
        })),
      })
      message.success('Stock issued')
      onClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <Modal
      title="Issue Stock"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      width={760}
      okText="Issue"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ lines: [{}] }}>
        <Form.Item label="Issue Date" name="issueDate">
          <DatePicker style={{ width: 220 }} />
        </Form.Item>
        <Form.List name="lines">
          {(fields, { add, remove }) => (
            <>
              {fields.map(field => (
                <IssueLineRow
                  key={field.key}
                  field={field}
                  itemOptions={itemOptions}
                  locationOptions={locationOptions}
                  requisitionItems={items}
                  procurementItems={procurementItems}
                  onRemove={fields.length > 1 ? () => remove(field.name) : undefined}
                />
              ))}
              <Button icon={<InboxOutlined />} onClick={() => add()} style={{ width: '100%' }}>
                Add Line
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}

interface IssueLineRowProps {
  field: FormListFieldData
  itemOptions: { label: string; value: string }[]
  locationOptions: { label: string; value: string }[]
  requisitionItems: StockRequisitionItem[]
  procurementItems: { id: string; batchTracking: boolean; heatTracking: boolean }[]
  onRemove?: () => void
}

const IssueLineRow: FC<IssueLineRowProps> = ({
  field,
  itemOptions,
  locationOptions,
  requisitionItems,
  procurementItems,
  onRemove,
}) => {
  const selectedRequisitionItemId = Form.useWatch([
    'lines',
    field.name,
    'stockRequisitionItemId',
  ]) as string | undefined
  const requisitionItem = requisitionItems.find(i => i.id === selectedRequisitionItemId)
  const masterItem = procurementItems.find(i => i.id === requisitionItem?.itemId)

  return (
    <Row gutter={8} align="top">
      <Col span={7}>
        <Form.Item
          name={[field.name, 'stockRequisitionItemId']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select placeholder="Pending item" options={itemOptions} />
        </Form.Item>
      </Col>
      <Col span={5}>
        <Form.Item
          name={[field.name, 'storeLocationId']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select placeholder="Store location" options={locationOptions} showSearch />
        </Form.Item>
      </Col>
      <Col span={4}>
        <Form.Item
          name={[field.name, 'batchNo']}
          rules={masterItem?.batchTracking ? [{ required: true, message: 'Required' }] : []}
        >
          <Input placeholder="Batch No" />
        </Form.Item>
      </Col>
      <Col span={4}>
        <Form.Item
          name={[field.name, 'heatNo']}
          rules={masterItem?.heatTracking ? [{ required: true, message: 'Required' }] : []}
        >
          <Input placeholder="Heat No" />
        </Form.Item>
      </Col>
      <Col span={3}>
        <Form.Item
          name={[field.name, 'issuedQty']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber placeholder="Qty" min={0.001} style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col span={1}>
        {onRemove && <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />}
      </Col>
    </Row>
  )
}

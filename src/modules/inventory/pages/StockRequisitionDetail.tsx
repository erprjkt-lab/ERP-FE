import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Input, Row, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StockIssue, StockRequisitionItem } from '@/types/inventory'
import { STOCK_REQUISITION_STATUS_BADGE, STOCK_REQUISITION_STATUS_LABELS } from '../constants'
import { useStockIssuesForRequisition } from '../hooks/useStockIssues'
import {
  useApproveStockRequisition,
  useCancelStockRequisition,
  useCloseStockRequisition,
  useRejectStockRequisition,
  useStockRequisition,
  useSubmitStockRequisition,
} from '../hooks/useStockRequisitions'
import { getErrorMessage } from '@/api/client'

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
    </div>
  )
}

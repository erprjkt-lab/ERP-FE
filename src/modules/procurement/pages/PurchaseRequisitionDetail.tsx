import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Input, Row, Space, Table, Typography } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PurchaseRequisitionItem } from '@/types/procurement'
import { REQUISITION_STATUS_BADGE, REQUISITION_STATUS_LABELS } from '../constants'
import {
  useApproveRequisition,
  usePurchaseRequisition,
  useRejectRequisition,
  useSubmitRequisitionForApproval,
} from '../hooks/usePurchaseRequisitions'

export const PurchaseRequisitionDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: requisition, isLoading } = usePurchaseRequisition(id)
  const { mutateAsync: submitForApproval, isPending: submitting } =
    useSubmitRequisitionForApproval()
  const { mutateAsync: approve, isPending: approving } = useApproveRequisition()
  const { mutateAsync: reject, isPending: rejecting } = useRejectRequisition()

  if (!requisition) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/requisitions')}>
          Back to Requisitions
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
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleApprove = async () => {
    try {
      await approve(requisition.id)
      message.success('Requisition approved')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleReject = () => {
    let reason = ''
    modal.confirm({
      title: 'Reject this requisition?',
      content: (
        <Input.TextArea
          placeholder="Reason for rejection"
          rows={3}
          onChange={e => {
            reason = e.target.value
          }}
        />
      ),
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reject({ id: requisition.id, reason })
          message.success('Requisition rejected')
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
      render: (_: unknown, r: PurchaseRequisitionItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.itemName ?? r.itemId}</div>
          {r.itemDescription && (
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{r.itemDescription}</div>
          )}
        </div>
      ),
    },
    { title: 'Required Qty', dataIndex: 'requiredQty', key: 'requiredQty' },
    { title: 'UOM', dataIndex: 'uomName', key: 'uomName' },
    { title: 'Pending Qty', dataIndex: 'pendingQty', key: 'pendingQty' },
    {
      title: 'Required Date',
      dataIndex: 'requiredDate',
      key: 'requiredDate',
      render: (v: string) => v ?? '—',
    },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', render: (v: string) => v ?? '—' },
  ]

  return (
    <div>
      <PageHeader
        title={requisition.requisitionNumber}
        subtitle={REQUISITION_STATUS_LABELS[requisition.status]}
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'Requisitions', href: '/purchase/requisitions' },
          { label: requisition.requisitionNumber },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/requisitions')}>
              Back
            </Button>
            {requisition.status === 'DRAFT' && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/purchase/requisitions/${requisition.id}/edit`)}
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
              <Button
                type="primary"
                onClick={() => navigate(`/purchase/enquiries/new?fromPr=${requisition.id}`)}
              >
                Create Enquiry
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
                  status={REQUISITION_STATUS_BADGE[requisition.status]}
                  label={REQUISITION_STATUS_LABELS[requisition.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Requisition Date">
                {requisition.requisitionDate}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">{requisition.priority}</Descriptions.Item>
              <Descriptions.Item label="Department">
                {requisition.departmentName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">{requisition.createdBy}</Descriptions.Item>
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
            <Table
              columns={columns}
              dataSource={requisition.items}
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

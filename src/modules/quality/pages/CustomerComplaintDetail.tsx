import {
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Alert, App, Button, Card, Descriptions, Empty, Image, Space, Tag, Timeline } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { ComplaintStatus } from '@/types/quality'
import { ComplaintResolutionDrawer } from '../components/ComplaintResolutionDrawer'
import { CustomerComplaintFormDrawer } from '../components/CustomerComplaintFormDrawer'
import { COMPLAINT_STATUS_BADGE, COMPLAINT_STATUS_LABELS } from '../constants'
import {
  useCloseCustomerComplaint,
  useCustomerComplaint,
  useStartComplaintReview,
} from '../hooks/useCustomerComplaints'

export const CustomerComplaintDetail: FC = () => {
  const { id } = useParams()
  const { modal, message } = App.useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [resolutionOpen, setResolutionOpen] = useState(false)

  const { data: complaint, isLoading } = useCustomerComplaint(id)
  const { mutateAsync: startReview, isPending: starting } = useStartComplaintReview()
  const { mutateAsync: closeComplaint, isPending: closing } = useCloseCustomerComplaint()

  if (!complaint) {
    return (
      <div>
        <PageHeader title="Customer Complaint" />
        <Card loading={isLoading}>{!isLoading && <Empty description="Complaint not found" />}</Card>
      </div>
    )
  }

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      message.success(success)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  // The lifecycle ERP-BE enforces: Open → In Review → Resolved → Closed. Filing a
  // resolution is what resolves it, and only a Resolved complaint can be closed.
  const canStartReview = complaint.status === 'open'
  const canResolve = complaint.status === 'open' || complaint.status === 'in_review'
  const canClose = complaint.status === 'resolved'
  const isClosed = complaint.status === 'closed'

  return (
    <div>
      <PageHeader
        title={complaint.complaintNumber}
        subtitle={`${complaint.partyName} · ${complaint.itemName}`}
        breadcrumbs={[
          { label: 'Quality' },
          { label: 'Customer Complaints', href: '/quality/customer-complaints' },
          { label: complaint.complaintNumber },
        ]}
        actions={
          <Space>
            {!isClosed && (
              <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}
            {canStartReview && (
              <Button
                icon={<FileTextOutlined />}
                loading={starting}
                onClick={() => run(() => startReview(complaint.id), 'Review started')}
              >
                Start Review
              </Button>
            )}
            {canResolve && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setResolutionOpen(true)}
              >
                Record Resolution
              </Button>
            )}
            {canClose && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={closing}
                onClick={() =>
                  modal.confirm({
                    title: `Close ${complaint.complaintNumber}?`,
                    content: 'A closed complaint can no longer be edited.',
                    okText: 'Close complaint',
                    onOk: () => run(() => closeComplaint(complaint.id), 'Complaint closed'),
                  })
                }
              >
                Close
              </Button>
            )}
          </Space>
        }
      />

      {complaint.productReturned && complaint.stockMovementId && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${complaint.returnedQty ?? 0} unit(s) were credited back into ${
            complaint.returnLocationName ?? 'stock'
          } as a customer return.`}
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="Status">
            <StatusBadge
              status={COMPLAINT_STATUS_BADGE[complaint.status as ComplaintStatus]}
              label={COMPLAINT_STATUS_LABELS[complaint.status as ComplaintStatus]}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Complaint Date">{complaint.complaintDate}</Descriptions.Item>
          <Descriptions.Item label="Customer">{complaint.partyName}</Descriptions.Item>
          <Descriptions.Item label="Item">{complaint.itemName}</Descriptions.Item>
          <Descriptions.Item label="Invoice">{complaint.invoiceNumber ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Product Returned">
            {complaint.productReturned ? (
              <Tag color="orange">{complaint.returnedQty ?? 0}</Tag>
            ) : (
              'No'
            )}
          </Descriptions.Item>
          {complaint.productReturned && (
            <>
              <Descriptions.Item label="Return Location">
                {complaint.returnLocationName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Batch No">{complaint.batchNo ?? '—'}</Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="Description" span={2}>
            {complaint.description}
          </Descriptions.Item>
          {complaint.defectImageUrl && (
            <Descriptions.Item label="Defect Image" span={2}>
              <Image src={complaint.defectImageUrl} alt="Reported defect" height={120} />
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={`Resolutions (${complaint.resolutions.length})`}>
        {complaint.resolutions.length === 0 ? (
          <Empty description="No resolution recorded yet. Recording one moves this complaint to Resolved." />
        ) : (
          <Timeline
            items={complaint.resolutions.map(resolution => ({
              children: (
                <div>
                  <Space>
                    <strong>{resolution.reportNumber}</strong>
                    <span style={{ color: '#888' }}>{resolution.resolvedAt.slice(0, 10)}</span>
                    {resolution.resolvedByName && <Tag>{resolution.resolvedByName}</Tag>}
                  </Space>
                  <div style={{ marginTop: 4 }}>{resolution.actionTaken}</div>
                  {resolution.customerFeedbackReference && (
                    <div style={{ marginTop: 4, color: '#888' }}>
                      Customer feedback: {resolution.customerFeedbackReference}
                    </div>
                  )}
                  {resolution.remark && (
                    <div style={{ marginTop: 4, color: '#888' }}>{resolution.remark}</div>
                  )}
                  {resolution.documentUrl && (
                    <a
                      href={resolution.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-block', marginTop: 4 }}
                    >
                      View report document
                    </a>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Card>

      <CustomerComplaintFormDrawer
        open={editOpen}
        complaint={complaint}
        onClose={() => setEditOpen(false)}
      />
      <ComplaintResolutionDrawer
        open={resolutionOpen}
        complaintId={complaint.id}
        complaintNumber={complaint.complaintNumber}
        onClose={() => setResolutionOpen(false)}
      />
    </div>
  )
}

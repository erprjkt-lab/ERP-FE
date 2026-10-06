import { CheckOutlined, EditOutlined } from '@ant-design/icons'
import { App, Button, Drawer, Empty, Space, Table, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  DECISION_LABELS,
  REJECTION_REVIEW_STATUS_BADGE,
  REJECTION_REVIEW_STATUS_LABELS,
  REJECTION_STATUS_BADGE,
  REJECTION_STATUS_LABELS,
} from '../constants'
import { ReviewRejectionModal } from './ReviewRejectionModal'
import { useJobCard } from '../hooks/useJobCards'
import { useApproveRejectionReview, useRejectionReviews } from '../hooks/useRejections'
import type { Rejection, RejectionReview } from '@/types/production'

interface RejectionReviewDrawerProps {
  rejection: Rejection | undefined
  open: boolean
  onClose: () => void
}

const RejectionReviewsPanel: FC<{ rejection: Rejection }> = ({ rejection }) => {
  const { message } = App.useApp()
  const { data: reviews, isLoading } = useRejectionReviews(rejection.id)
  const { mutateAsync: approve, isPending: approving } = useApproveRejectionReview()

  const handleApprove = async (id: string) => {
    try {
      await approve(id)
      message.success('Rejection review approved')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns: TableColumnsType<RejectionReview> = [
    {
      title: 'Decision',
      dataIndex: 'decision',
      key: 'decision',
      width: 80,
      render: v => DECISION_LABELS[v as RejectionReview['decision']],
    },
    { title: 'Qty', dataIndex: 'reviewedQty', key: 'reviewedQty', width: 70, align: 'right' },
    { title: 'Reason', dataIndex: 'reasonName', key: 'reasonName', render: v => v ?? '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: v => (
        <StatusBadge
          status={REJECTION_REVIEW_STATUS_BADGE[v as RejectionReview['status']]}
          label={REJECTION_REVIEW_STATUS_LABELS[v as RejectionReview['status']]}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, r) =>
        r.status === 'SUBMITTED' ? (
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            loading={approving}
            onClick={() => handleApprove(r.id)}
          >
            Approve
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  return isLoading ? (
    <Typography.Text>Loading reviews…</Typography.Text>
  ) : reviews.length === 0 ? (
    <Empty description="No reviews yet" style={{ marginTop: 16 }} />
  ) : (
    <Table<RejectionReview>
      columns={columns}
      dataSource={reviews}
      rowKey="id"
      pagination={false}
      size="small"
      style={{ marginTop: 12 }}
    />
  )
}

export const RejectionReviewDrawer: FC<RejectionReviewDrawerProps> = ({
  rejection,
  open,
  onClose,
}) => {
  const [reviewingRejection, setReviewingRejection] = useState<Rejection>()
  const { data: jobCard } = useJobCard(rejection?.jobCardId)

  if (!rejection) return null

  return (
    <>
      <Drawer
        title={`Review Rejection - ${rejection.jobCardNumber}`}
        placement="right"
        onClose={onClose}
        open={open}
        width={600}
        styles={{ body: { paddingBottom: 80 } }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Typography.Title level={5}>Rejection Details</Typography.Title>
            <Space direction="vertical" size="small">
              <div>
                <Typography.Text type="secondary">Item:</Typography.Text>{' '}
                <Typography.Text strong>{jobCard?.itemName ?? '—'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Party:</Typography.Text>{' '}
                <Typography.Text strong>{jobCard?.partyName ?? '—'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Process:</Typography.Text>{' '}
                <Typography.Text strong>{rejection.processName ?? '—'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Rejected Qty:</Typography.Text>{' '}
                <Typography.Text strong>{rejection.rejectedQty}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Pending Qty:</Typography.Text>{' '}
                <Typography.Text strong>{rejection.pendingQty ?? '—'}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Status:</Typography.Text>{' '}
                <StatusBadge
                  status={REJECTION_STATUS_BADGE[rejection.status]}
                  label={REJECTION_STATUS_LABELS[rejection.status]}
                />
              </div>
            </Space>
          </div>

          <div>
            <Typography.Title level={5}>Reviews</Typography.Title>
            <RejectionReviewsPanel rejection={rejection} />
          </div>

          {rejection.pendingQty ? (
            <Button
              type="primary"
              block
              icon={<EditOutlined />}
              onClick={() => setReviewingRejection(rejection)}
            >
              Add Review
            </Button>
          ) : null}
        </Space>
      </Drawer>

      {reviewingRejection && (
        <ReviewRejectionModal
          open={!!reviewingRejection}
          rejection={reviewingRejection}
          onClose={() => setReviewingRejection(undefined)}
          jobCardRoutes={jobCard?.routes ?? []}
        />
      )}
    </>
  )
}

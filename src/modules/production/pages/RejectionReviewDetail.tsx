import { ArrowLeftOutlined, CheckOutlined, EditOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Space, Table, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  DECISION_LABELS,
  ORIGIN_LABELS,
  REJECTION_REVIEW_STATUS_BADGE,
  REJECTION_REVIEW_STATUS_LABELS,
  REJECTION_STATUS_BADGE,
  REJECTION_STATUS_LABELS,
} from '../constants'
import { MetaItem, SummaryStat } from '../components/JobCardStats'
import { ReviewRejectionModal } from '../components/ReviewRejectionModal'
import { useJobCard } from '../hooks/useJobCards'
import { useJobCardMovements } from '../hooks/useJobCardMovements'
import { useProcessLogs } from '../hooks/useProcessLogs'
import {
  useApproveRejectionReview,
  useRejectionReviews,
  useRejectionsForJobCard,
} from '../hooks/useRejections'
import { computeStepProgress } from '../utils/jobCardProgress'
import type { StepProgress } from '../utils/jobCardProgress'
import type { Rejection, RejectionReview } from '@/types/production'

const PROCESS_COLUMNS: TableColumnsType<StepProgress> = [
  { title: '#', key: 'seq', width: 50, render: (_, r) => r.step.sequenceNo },
  { title: 'Process', key: 'process', render: (_, r) => r.step.processName },
  { title: 'In', dataIndex: 'availableQty', key: 'availableQty', width: 80 },
  { title: 'OK', dataIndex: 'okQty', key: 'okQty', width: 80 },
  { title: 'Rejected', dataIndex: 'rejectedQty', key: 'rejectedQty', width: 95 },
  { title: 'Pending', dataIndex: 'pendingQty', key: 'pendingQty', width: 90 },
]

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
      width: 90,
      render: v => DECISION_LABELS[v as RejectionReview['decision']],
    },
    { title: 'Qty', dataIndex: 'reviewedQty', key: 'reviewedQty', width: 80, align: 'right' },
    { title: 'Reason', dataIndex: 'reasonName', key: 'reasonName', render: v => v ?? '—' },
    {
      title: 'Detail',
      key: 'detail',
      render: (_, r) =>
        r.decision === 'REWORK'
          ? `→ ${r.reworkProcessName ?? r.reworkProcessId ?? '—'}`
          : [
              r.originType ? ORIGIN_LABELS[r.originType] : null,
              r.machineName,
              r.vendorName,
              r.challanNumber,
            ]
              .filter(Boolean)
              .join(' · ') || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
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
      width: 100,
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

  return (
    <DataTable<RejectionReview>
      columns={columns}
      dataSource={reviews}
      rowKey="id"
      loading={isLoading}
      pagination={false}
      size="small"
      locale={{ emptyText: 'No reviews recorded yet for this rejection.' }}
    />
  )
}

export const RejectionReviewDetail: FC = () => {
  const { jobCardId } = useParams()
  const navigate = useNavigate()
  const [reviewingRejection, setReviewingRejection] = useState<Rejection>()

  const { data: jobCard, isLoading } = useJobCard(jobCardId)
  const { data: logs = [] } = useProcessLogs(jobCardId)
  const { data: movements = [] } = useJobCardMovements(jobCardId)
  const { data: rejections, isLoading: rejectionsLoading } = useRejectionsForJobCard(jobCardId)

  const orderedQty = jobCard?.orderedQty ?? 0
  const progress = computeStepProgress(jobCard?.routes ?? [], logs, movements, orderedQty)
  const finalOk = progress.length ? progress[progress.length - 1].okQty : 0
  const totalRejected = progress.reduce((sum, row) => sum + row.rejectedQty, 0)

  const rejectionColumns: TableColumnsType<Rejection> = [
    { title: 'Process', dataIndex: 'processName', key: 'processName', render: v => v ?? '—' },
    {
      title: 'Rejected Qty',
      dataIndex: 'rejectedQty',
      key: 'rejectedQty',
      width: 120,
      align: 'right',
    },
    {
      title: 'Pending Qty',
      dataIndex: 'pendingQty',
      key: 'pendingQty',
      width: 120,
      align: 'right',
      render: v => v ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: v => (
        <StatusBadge
          status={REJECTION_STATUS_BADGE[v as Rejection['status']]}
          label={REJECTION_STATUS_LABELS[v as Rejection['status']]}
        />
      ),
    },
    {
      title: 'Logged',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: v => v ?? '—',
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      render: (_, r) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          disabled={!r.pendingQty}
          onClick={() => setReviewingRejection(r)}
        >
          Review
        </Button>
      ),
    },
  ]

  if (!jobCard) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/entries')}>
          Back to Production Entry
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Job card not found.'}</p>
      </div>
    )
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/entries')}>
          Back to Production Entry
        </Button>
        <Button onClick={() => navigate(`/production/work-orders/${jobCard.id}`)}>
          Open Full Job Card
        </Button>
      </Space>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={12} sm={6} md={4}>
            <SummaryStat label="Ordered" value={orderedQty} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <SummaryStat label="Completed" value={finalOk} tone="#237804" />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <SummaryStat
              label="Rejected"
              value={totalRejected}
              tone={totalRejected ? '#a8071a' : undefined}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <SummaryStat label="Balance" value={Math.max(orderedQty - finalOk, 0)} />
          </Col>
          <Col xs={24} md={8}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {jobCard.jobCardNumber}
            </Typography.Title>
            <Tag color="blue" style={{ marginTop: 4 }}>
              {jobCard.status}
            </Tag>
          </Col>
        </Row>
        <Descriptions size="small" column={1} style={{ marginTop: 4 }}>
          <Descriptions.Item>
            <Space size="middle" wrap>
              <MetaItem label="Item" value={jobCard.itemName} />
              <MetaItem label="Party" value={jobCard.partyName} />
              <MetaItem label="Target" value={jobCard.targetDate} />
              <MetaItem label="Output Store" value={jobCard.outputLocationName} />
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Process Detail" style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
        <Table<StepProgress>
          columns={PROCESS_COLUMNS}
          dataSource={progress}
          rowKey={record => record.step.id}
          pagination={false}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title="Rejections">
        <DataTable<Rejection>
          columns={rejectionColumns}
          dataSource={rejections}
          rowKey="id"
          loading={rejectionsLoading}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No rejections recorded for this job card.' }}
          expandable={{
            expandedRowRender: rejection => <RejectionReviewsPanel rejection={rejection} />,
          }}
        />
      </Card>

      <ReviewRejectionModal
        open={!!reviewingRejection}
        onClose={() => setReviewingRejection(undefined)}
        rejection={reviewingRejection}
        jobCardRoutes={jobCard.routes}
      />
    </div>
  )
}

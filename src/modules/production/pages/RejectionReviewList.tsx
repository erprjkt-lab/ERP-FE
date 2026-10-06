import { EyeOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Card, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { RejectionReviewDrawer } from '../components/RejectionReviewDrawer'
import { useJobCards } from '../hooks/useJobCards'
import { usePendingRejections } from '../hooks/useRejections'
import type { Rejection } from '@/types/production'

export const RejectionReviewList: FC = () => {
  const navigate = useNavigate()
  const [selectedRejection, setSelectedRejection] = useState<Rejection>()
  const { data: rejections, isLoading } = usePendingRejections()
  const { data: jobCards, isLoading: jobCardsLoading } = useJobCards()

  const jobCardById = new Map(jobCards.map(jc => [jc.id, jc]))

  const columns: TableColumnsType<Rejection> = [
    { title: 'Job Card #', dataIndex: 'jobCardNumber', key: 'jobCardNumber', width: 150 },
    {
      title: 'Job Card Date',
      key: 'jobCardDate',
      width: 130,
      render: (_, r) => jobCardById.get(r.jobCardId)?.jobCardDate ?? '—',
    },
    {
      title: 'Item',
      key: 'item',
      render: (_, r) => jobCardById.get(r.jobCardId)?.itemName ?? '—',
    },
    {
      title: 'Party',
      key: 'party',
      render: (_, r) => jobCardById.get(r.jobCardId)?.partyName ?? '—',
    },
    {
      title: 'Process',
      key: 'process',
      render: (_, r) => r.processName ?? '—',
    },
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
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedRejection(r)}>
          Review
        </Button>
      ),
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Rejection Review"
        subtitle={`${rejections.length} rejection${rejections.length === 1 ? '' : 's'}`}
        breadcrumbs={[{ label: 'Production' }, { label: 'Rejection Review' }]}
        actions={
          <Tooltip title="Set up the Rework / Reject reasons reviewers choose from">
            <Button
              icon={<SettingOutlined />}
              onClick={() => navigate('/production/rejection-reasons')}
            >
              Rejection Reasons
            </Button>
          </Tooltip>
        }
      />

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<Rejection>
          columns={columns}
          dataSource={rejections}
          rowKey="id"
          loading={isLoading || jobCardsLoading}
          totalLabel="rejections"
          fillHeight
          onRow={record => ({
            onClick: () => setSelectedRejection(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <RejectionReviewDrawer
        // Prefer the live row so pending qty refreshes after a review is added.
        rejection={rejections.find(r => r.id === selectedRejection?.id) ?? selectedRejection}
        open={!!selectedRejection}
        onClose={() => setSelectedRejection(undefined)}
      />
    </div>
  )
}

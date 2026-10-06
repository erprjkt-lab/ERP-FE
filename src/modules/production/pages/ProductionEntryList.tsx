import { EyeOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Card, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { useJobCards } from '../hooks/useJobCards'
import { usePendingRejections } from '../hooks/useRejections'
import type { RejectionJobCardGroup } from '../utils/rejectionGrouping'
import { groupRejectionsByJobCard } from '../utils/rejectionGrouping'

export const ProductionEntryList: FC = () => {
  const navigate = useNavigate()
  const { data: rejections, isLoading } = usePendingRejections()
  const { data: jobCards, isLoading: jobCardsLoading } = useJobCards()

  const rows = groupRejectionsByJobCard(rejections)
  const jobCardById = new Map(jobCards.map(jc => [jc.id, jc]))
  const openReview = (jobCardId: string) => navigate(`/production/entries/job-cards/${jobCardId}`)

  const columns: TableColumnsType<RejectionJobCardGroup> = [
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
      render: (_, r) => r.processNames.join(', '),
    },
    {
      title: 'Ordered Qty',
      key: 'orderedQty',
      width: 120,
      align: 'right',
      render: (_, r) => jobCardById.get(r.jobCardId)?.orderedQty ?? '—',
    },
    {
      title: 'Rejected Qty',
      dataIndex: 'rejectedQtyTotal',
      key: 'rejectedQtyTotal',
      width: 130,
      align: 'right',
    },
    {
      title: 'Pending Qty',
      dataIndex: 'pendingQtyTotal',
      key: 'pendingQtyTotal',
      width: 130,
      align: 'right',
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => openReview(r.jobCardId)}>
          Review
        </Button>
      ),
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Production Entry"
        subtitle={`${rows.length} job card${rows.length === 1 ? '' : 's'} with pending rejections`}
        breadcrumbs={[{ label: 'Production' }, { label: 'Production Entry' }]}
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
        <DataTable<RejectionJobCardGroup>
          columns={columns}
          dataSource={rows}
          rowKey="jobCardId"
          loading={isLoading || jobCardsLoading}
          totalLabel="job cards"
          fillHeight
          onRow={record => ({
            onClick: () => openReview(record.jobCardId),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

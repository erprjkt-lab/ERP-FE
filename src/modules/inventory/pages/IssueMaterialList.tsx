import { InboxOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row } from 'antd'
import type { TableColumnsType } from 'antd'
import { useState } from 'react'
import { useModulePermission } from '@/store/permissionStore'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { IssueMaterialDrawer } from '../components/IssueMaterialDrawer'
import { useJobCards } from '@/modules/production/hooks/useJobCards'
import type { JobCard } from '@/types/production'
import { formatDateTime } from '@/utils/date'

// Material can only be issued against jobs that haven't finished yet.
const OPEN_STATUSES: JobCard['status'][] = ['draft', 'in_progress']

const getColumns = (
  onIssue: (record: JobCard) => void,
  canIssue: boolean,
): TableColumnsType<JobCard> => [
  { title: 'Job Card No', dataIndex: 'jobCardNumber', key: 'jobCardNumber', width: 130 },
  {
    title: 'Date',
    dataIndex: 'jobCardDate',
    key: 'jobCardDate',
    width: 110,
    render: formatDateTime,
  },
  { title: 'Item', dataIndex: 'itemName', key: 'itemName' },
  { title: 'Party', dataIndex: 'partyName', key: 'partyName', render: name => name || '—' },
  { title: 'Ordered Qty', dataIndex: 'orderedQty', key: 'orderedQty', width: 110 },
  {
    title: 'Target Date',
    dataIndex: 'targetDate',
    key: 'targetDate',
    width: 110,
    render: formatDateTime,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => <StatusBadge status={status} />,
  },
  {
    title: 'Action',
    key: 'action',
    width: 150,
    render: (_, record) =>
      canIssue ? (
        <Button size="small" icon={<InboxOutlined />} onClick={() => onIssue(record)}>
          Issue Material
        </Button>
      ) : null,
  },
]

export interface IssueMaterialListProps {
  /** Rendered inside the Stock Issue page's tabs — drops the page header so the
   *  tab doesn't show a second title under the page's own. */
  embedded?: boolean
}

export const IssueMaterialList = ({ embedded = false }: IssueMaterialListProps) => {
  // Issuing material against a job card writes a stock issue — and this list is
  // reachable both standalone and embedded in the Stock Issue page, so it asks
  // the stock-issues module directly rather than relying on the route.
  const { canWrite: canWriteIssues } = useModulePermission('stock-issues')
  const [search, setSearch] = useState('')
  const [activeJobCard, setActiveJobCard] = useState<JobCard>()

  const { data: jobCards = [], isLoading } = useJobCards()

  const openJobCards = jobCards.filter(jc => OPEN_STATUSES.includes(jc.status))

  const filtered = openJobCards.filter(jc => {
    if (!search) return true
    const term = search.toLowerCase()
    return jc.jobCardNumber.toLowerCase().includes(term) || jc.itemName.toLowerCase().includes(term)
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {embedded ? (
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by job card no. or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      ) : (
        <PageHeader
          title="Issue Material"
          subtitle={`${filtered.length} of ${openJobCards.length} open job cards`}
          breadcrumbs={[{ label: 'Inventory' }, { label: 'Issue Material' }]}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input.Search
                placeholder="Search by job card no. or item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                allowClear
              />
            </Col>
          </Row>
        </PageHeader>
      )}

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<JobCard>
          columns={getColumns(record => setActiveJobCard(record), canWriteIssues)}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="job cards"
          fillHeight
          locale={{ emptyText: 'No draft or in-progress job cards need material right now.' }}
        />
      </Card>

      <IssueMaterialDrawer
        open={!!activeJobCard}
        onClose={() => setActiveJobCard(undefined)}
        jobCardId={activeJobCard?.id ?? ''}
        jobCardNumber={activeJobCard?.jobCardNumber}
        itemId={activeJobCard?.itemId ?? ''}
        orderedQty={activeJobCard?.orderedQty ?? 0}
      />
    </div>
  )
}

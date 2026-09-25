import { EyeOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useJobCards } from '@/modules/production/hooks/useJobCards'
import type { JobCard } from '@/types/production'
import { JobCardInspectionReports } from '../components/JobCardInspectionReports'

const getColumns = (onOpen: (record: JobCard) => void): TableColumnsType<JobCard> => [
  { title: 'Job Card No', dataIndex: 'jobCardNumber', key: 'jobCardNumber', width: 130 },
  { title: 'Item', dataIndex: 'itemName', key: 'itemName' },
  { title: 'Party', dataIndex: 'partyName', key: 'partyName', render: name => name || '—' },
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
    width: 140,
    render: (_, record) => (
      <Button size="small" icon={<EyeOutlined />} onClick={() => onOpen(record)}>
        Manage IPR
      </Button>
    ),
  },
]

export const IprList: FC = () => {
  const [search, setSearch] = useState('')
  const [activeJobCard, setActiveJobCard] = useState<JobCard>()
  const { data: jobCards = [], isLoading } = useJobCards()

  const filtered = jobCards.filter(jc => {
    if (!search) return true
    const term = search.toLowerCase()
    return jc.jobCardNumber.toLowerCase().includes(term) || jc.itemName.toLowerCase().includes(term)
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="In-Process Inspection Reports (IPR)"
        subtitle={`${filtered.length} of ${jobCards.length} job cards`}
        breadcrumbs={[{ label: 'Quality' }, { label: 'IPR' }]}
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

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<JobCard>
          columns={getColumns(record => setActiveJobCard(record))}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="job cards"
          fillHeight
        />
      </Card>

      {activeJobCard && (
        <Modal
          title={`IPR — ${activeJobCard.jobCardNumber}`}
          open
          onCancel={() => setActiveJobCard(undefined)}
          footer={null}
          width={860}
        >
          <JobCardInspectionReports
            jobCardId={activeJobCard.id}
            itemId={activeJobCard.itemId}
            routeProcesses={activeJobCard.routes.map(r => ({
              id: r.processId,
              name: r.processName,
            }))}
            reportType="IPR"
          />
        </Modal>
      )}
    </div>
  )
}

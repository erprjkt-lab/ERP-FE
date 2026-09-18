import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Segmented, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { JobCard, JobCardStatus } from '@/types/production'
import { JOB_CARD_STATUS_CODE, useJobCards } from '../hooks/useJobCards'

const ALL_STATUSES = 'all' as const

const STATUS_OPTIONS: { label: string; value: JobCardStatus | typeof ALL_STATUSES }[] = [
  { label: 'All', value: ALL_STATUSES },
  { label: 'Draft', value: 'draft' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Closed', value: 'closed' },
]

const ROUTE_LABEL: Record<JobCard['manufacturingRoute'], string> = {
  standard: 'Standard',
  rework: 'Rework',
  sample: 'Sample',
}

const getColumns = (onOpen: (record: JobCard) => void): TableColumnsType<JobCard> => [
  {
    title: 'Job Card No',
    dataIndex: 'jobCardNumber',
    key: 'jobCardNumber',
    width: 130,
    render: (_, record) => (
      <Button type="link" style={{ padding: 0 }} onClick={() => onOpen(record)}>
        {record.jobCardNumber}
      </Button>
    ),
  },
  { title: 'Date', dataIndex: 'jobCardDate', key: 'jobCardDate', width: 110 },
  {
    title: 'Item',
    key: 'item',
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 500 }}>{record.itemName}</div>
        {record.itemRevision && (
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>Rev {record.itemRevision}</div>
        )}
      </div>
    ),
  },
  { title: 'Party', dataIndex: 'partyName', key: 'partyName', render: name => name || '—' },
  { title: 'Ordered Qty', dataIndex: 'orderedQty', key: 'orderedQty', width: 110 },
  { title: 'Target Date', dataIndex: 'targetDate', key: 'targetDate', width: 110 },
  {
    title: 'Route',
    dataIndex: 'manufacturingRoute',
    key: 'manufacturingRoute',
    width: 100,
    render: route => <Tag>{ROUTE_LABEL[route as JobCard['manufacturingRoute']]}</Tag>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => <StatusBadge status={status} />,
  },
]

export const JobCardList: FC = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<JobCardStatus | typeof ALL_STATUSES>(
    ALL_STATUSES,
  )
  const [search, setSearch] = useState('')

  const { data: jobCards = [], isLoading } = useJobCards(
    statusFilter !== ALL_STATUSES ? { status: JOB_CARD_STATUS_CODE[statusFilter] } : {},
  )

  const filtered = jobCards.filter(jc => {
    if (!search) return true
    const term = search.toLowerCase()
    return jc.jobCardNumber.toLowerCase().includes(term) || jc.itemName.toLowerCase().includes(term)
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Work Orders (Job Cards)"
        subtitle={`${filtered.length} of ${jobCards.length} job cards`}
        breadcrumbs={[{ label: 'Production' }, { label: 'Work Order (Jobcard)' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/production/work-orders/new')}
          >
            Add Job Card
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Input.Search
              placeholder="Search by job card no. or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Segmented
                value={statusFilter}
                onChange={value => setStatusFilter(value as JobCardStatus | typeof ALL_STATUSES)}
                options={STATUS_OPTIONS}
              />
              {(statusFilter !== ALL_STATUSES || search) && (
                <Button
                  type="link"
                  onClick={() => {
                    setStatusFilter(ALL_STATUSES)
                    setSearch('')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
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
          columns={getColumns(record => navigate(`/production/work-orders/${record.id}`))}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="job cards"
          fillHeight
        />
      </Card>
    </div>
  )
}

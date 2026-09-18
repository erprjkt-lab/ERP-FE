import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesEnquiry } from '@/types/sales'
import { ENQUIRY_STATUS_BADGE, ENQUIRY_STATUS_LABELS } from '../constants'
import { useSalesEnquiries } from '../hooks/useSalesEnquiries'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (onView: (record: SalesEnquiry) => void): TableColumnsType<SalesEnquiry> => [
  { title: 'Enquiry #', dataIndex: 'enquiryNumber', key: 'enquiryNumber', width: 150 },
  { title: 'Date', dataIndex: 'enquiryDate', key: 'enquiryDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  { title: 'Ref By', dataIndex: 'refBy', key: 'refBy', width: 140, render: v => v || '—' },
  { title: 'Ref No', dataIndex: 'refNo', key: 'refNo', width: 130, render: v => v || '—' },
  { title: 'Items', key: 'items', width: 80, render: (_, r) => r.items.length },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={ENQUIRY_STATUS_BADGE[status as SalesEnquiry['status']]}
        label={ENQUIRY_STATUS_LABELS[status as SalesEnquiry['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 60,
    render: (_, record) => (
      <Tooltip title="View">
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={e => {
            e.stopPropagation()
            onView(record)
          }}
        />
      </Tooltip>
    ),
  },
]

export const SalesEnquiryList: FC = () => {
  const navigate = useNavigate()
  const status = useSalesStatusFilter('enquiry')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const {
    data: enquiries,
    meta,
    isLoading,
    isFetching,
  } = useSalesEnquiries({ page, perPage: pageSize, status })

  // Status filtering happens server-side, so changing it has to send the
  // user back to page 1 — otherwise they can sit on a page number that
  // no longer exists in the filtered result set.
  const handleStatusChange = (value: string | null) => {
    setStatus('enquiry', value ?? null)
    setPage(1)
  }

  const columns = getColumns(record => navigate(`/sales/enquiries/${record.id}`))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Enquiries"
        subtitle={`${meta?.total ?? 0} enquiries`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Sales Enquiry' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/enquiries/new')}
          >
            New Enquiry
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              value={status}
              onChange={handleStatusChange}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          {status && (
            <Col>
              <Button onClick={() => handleStatusChange(null)}>Clear filter</Button>
            </Col>
          )}
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<SalesEnquiry>
          columns={columns}
          dataSource={enquiries}
          rowKey="id"
          loading={isLoading || isFetching}
          pagination={{
            current: page,
            pageSize,
            total: meta?.total ?? 0,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
          totalLabel="enquiries"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/sales/enquiries/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

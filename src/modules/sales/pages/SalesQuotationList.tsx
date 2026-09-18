import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Tag, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesQuotation } from '@/types/sales'
import { QUOTATION_STATUS_BADGE, QUOTATION_STATUS_LABELS } from '../constants'
import { useSalesQuotations } from '../hooks/useSalesQuotations'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(QUOTATION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (onView: (record: SalesQuotation) => void): TableColumnsType<SalesQuotation> => [
  { title: 'Quotation #', dataIndex: 'quotationNumber', key: 'quotationNumber', width: 160 },
  {
    title: 'Rev',
    dataIndex: 'revisionNo',
    key: 'revisionNo',
    width: 70,
    render: (value: number) => (value > 0 ? <Tag color="blue">R{value}</Tag> : '—'),
  },
  { title: 'Date', dataIndex: 'quotationDate', key: 'quotationDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  {
    title: 'Source',
    key: 'source',
    width: 110,
    render: (_, r) => (r.salesEnquiryId ? 'From Enquiry' : 'Direct'),
  },
  {
    title: 'Valid Until',
    dataIndex: 'validUntil',
    key: 'validUntil',
    width: 120,
    render: v => v || '—',
  },
  {
    title: 'Net Amount',
    key: 'netAmount',
    width: 130,
    render: (_, r) => r.netAmount.toFixed(2),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={QUOTATION_STATUS_BADGE[status as SalesQuotation['status']]}
        label={QUOTATION_STATUS_LABELS[status as SalesQuotation['status']]}
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

export const SalesQuotationList: FC = () => {
  const navigate = useNavigate()
  const status = useSalesStatusFilter('quotation')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const {
    data: quotations,
    meta,
    isLoading,
    isFetching,
  } = useSalesQuotations({ page, perPage: pageSize, status })

  // Status filtering happens server-side, so changing it has to send the
  // user back to page 1 — otherwise they can sit on a page number that
  // no longer exists in the filtered result set.
  const handleStatusChange = (value: string | null) => {
    setStatus('quotation', value ?? null)
    setPage(1)
  }

  const columns = getColumns(record => navigate(`/sales/quotations/${record.id}`))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Quotations"
        subtitle={`${meta?.total ?? 0} quotations`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Quotation' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/quotations/new')}
          >
            New Quotation
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
        <DataTable<SalesQuotation>
          columns={columns}
          dataSource={quotations}
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
          totalLabel="quotations"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/sales/quotations/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

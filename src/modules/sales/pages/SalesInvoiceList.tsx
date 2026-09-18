import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesInvoice } from '@/types/sales'
import { INVOICE_STATUS_BADGE, INVOICE_STATUS_LABELS } from '../constants'
import { useSalesInvoices } from '../hooks/useSalesInvoices'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (onView: (record: SalesInvoice) => void): TableColumnsType<SalesInvoice> => [
  { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber', width: 160 },
  { title: 'Date', dataIndex: 'invoiceDate', key: 'invoiceDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  {
    title: 'Taxable',
    dataIndex: 'taxableAmount',
    key: 'taxableAmount',
    width: 120,
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Tax',
    dataIndex: 'taxAmount',
    key: 'taxAmount',
    width: 110,
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Net Amount',
    dataIndex: 'netAmount',
    key: 'netAmount',
    width: 130,
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={INVOICE_STATUS_BADGE[status as SalesInvoice['status']]}
        label={INVOICE_STATUS_LABELS[status as SalesInvoice['status']]}
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

export const SalesInvoiceList: FC = () => {
  const navigate = useNavigate()
  const status = useSalesStatusFilter('invoice')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const {
    data: invoices,
    meta,
    isLoading,
    isFetching,
  } = useSalesInvoices({
    page,
    perPage: pageSize,
    status,
  })

  const handleStatusChange = (value: string | null) => {
    setStatus('invoice', value ?? null)
    setPage(1)
  }

  const columns = getColumns(record => navigate(`/sales/invoices/${record.id}`))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Invoices"
        subtitle={`${meta?.total ?? 0} invoices`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Sales Invoice' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/invoices/new')}
          >
            New Invoice
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
        <DataTable<SalesInvoice>
          columns={columns}
          dataSource={invoices}
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
          totalLabel="invoices"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/sales/invoices/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Select, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PurchaseEnquiry } from '@/types/procurement'
import { ENQUIRY_STATUS_BADGE, ENQUIRY_STATUS_LABELS } from '../constants'
import { usePurchaseEnquiries } from '../hooks/usePurchaseEnquiries'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

const STATUS_OPTIONS = Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (
  onView: (record: PurchaseEnquiry) => void,
): TableColumnsType<PurchaseEnquiry> => [
  { title: 'Enquiry #', dataIndex: 'enquiryNumber', key: 'enquiryNumber', width: 140 },
  { title: 'Date', dataIndex: 'enquiryDate', key: 'enquiryDate', width: 120 },
  { title: 'Due Date', dataIndex: 'enquiryDueDate', key: 'enquiryDueDate', render: v => v ?? '—' },
  { title: 'Items', key: 'items', width: 80, render: (_, r) => r.items.length },
  { title: 'Suppliers', key: 'suppliers', width: 90, render: (_, r) => r.suppliers.length },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => (
      <StatusBadge
        status={ENQUIRY_STATUS_BADGE[status as PurchaseEnquiry['status']]}
        label={ENQUIRY_STATUS_LABELS[status as PurchaseEnquiry['status']]}
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

export const PurchaseEnquiryList: FC = () => {
  const navigate = useNavigate()
  const { data: enquiries, isLoading } = usePurchaseEnquiries()
  const filters = useProcurementFilters('enquiry')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const columns = getColumns(record => navigate(`/purchase/enquiries/${record.id}`))

  const filtered = enquiries.filter(pe => {
    if (filters.search && !pe.enquiryNumber.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && pe.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Purchase Enquiries"
        subtitle={`${filtered.length} of ${enquiries.length} enquiries`}
        breadcrumbs={[{ label: 'Purchase', href: '/purchase' }, { label: 'Enquiries' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/purchase/enquiries/new')}
          >
            New Enquiry
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by enquiry #..."
              value={filters.search}
              onChange={e => setFilter('enquiry', 'search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={v => setFilter('enquiry', 'status', v)}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={() => resetFilters('enquiry')}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<PurchaseEnquiry>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="enquiries"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/purchase/enquiries/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

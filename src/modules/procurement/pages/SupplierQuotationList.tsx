import { EyeOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import type { SupplierQuotation } from '@/types/procurement'
import { usePurchaseEnquiries } from '../hooks/usePurchaseEnquiries'
import { useSupplierQuotations } from '../hooks/useSupplierQuotations'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

export const SupplierQuotationList: FC = () => {
  const navigate = useNavigate()
  const { data: quotations, isLoading } = useSupplierQuotations()
  const { data: enquiries } = usePurchaseEnquiries()
  const filters = useProcurementFilters('quotation')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const enquiryById = new Map(enquiries.map(e => [e.id, e]))

  const columns: TableColumnsType<SupplierQuotation> = [
    { title: 'Quotation #', dataIndex: 'quotationNumber', key: 'quotationNumber', width: 140 },
    {
      title: 'Enquiry #',
      key: 'enquiry',
      render: (_, r) => enquiryById.get(r.purchaseEnquiryId)?.enquiryNumber ?? '—',
    },
    { title: 'Date', dataIndex: 'quotationDate', key: 'quotationDate', width: 120 },
    { title: 'Valid Until', dataIndex: 'validUntil', key: 'validUntil', render: v => v ?? '—' },
    {
      title: 'Total',
      key: 'total',
      render: (_, r) => `${r.currency} ${r.totalAmount.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Tooltip title="View Enquiry">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={e => {
              e.stopPropagation()
              navigate(`/purchase/enquiries/${record.purchaseEnquiryId}`)
            }}
          />
        </Tooltip>
      ),
    },
  ]

  const filtered = quotations.filter(q => {
    if (filters.search && !q.quotationNumber.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Supplier Quotations"
        subtitle={`${filtered.length} of ${quotations.length} quotations`}
        breadcrumbs={[{ label: 'Purchase', href: '/purchase' }, { label: 'Quotations' }]}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by quotation #..."
              value={filters.search}
              onChange={e => setFilter('quotation', 'search', e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Button onClick={() => resetFilters('quotation')}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<SupplierQuotation>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="quotations"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/purchase/enquiries/${record.purchaseEnquiryId}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

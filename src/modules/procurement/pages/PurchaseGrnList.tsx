import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Select, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Grn } from '@/types/procurement'
import { GRN_STATUS_BADGE, GRN_STATUS_LABELS } from '../constants'
import { useGrns } from '../hooks/usePurchaseGrns'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

const STATUS_OPTIONS = Object.entries(GRN_STATUS_LABELS).map(([value, label]) => ({ value, label }))

const getColumns = (onView: (record: Grn) => void): TableColumnsType<Grn> => [
  { title: 'GRN #', dataIndex: 'grnNo', key: 'grnNo', width: 130 },
  { title: 'Date', dataIndex: 'grnDate', key: 'grnDate', width: 120 },
  { title: 'Supplier', dataIndex: 'supplierName', key: 'supplierName' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => (
      <StatusBadge
        status={GRN_STATUS_BADGE[status as Grn['status']]}
        label={GRN_STATUS_LABELS[status as Grn['status']]}
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

export const PurchaseGrnList: FC = () => {
  const navigate = useNavigate()
  const { data: grns, isLoading } = useGrns()
  const filters = useProcurementFilters('grn')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const columns = getColumns(record => navigate(`/purchase/grn/${record.id}`))

  const filtered = grns.filter(grn => {
    if (filters.search && !grn.grnNo.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && String(grn.status) !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Goods Receipt Notes"
        subtitle={`${filtered.length} of ${grns.length} GRNs`}
        breadcrumbs={[{ label: 'Purchase', href: '/purchase' }, { label: 'GRN' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/purchase/grn/new')}
          >
            New GRN
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by GRN #..."
              value={filters.search}
              onChange={e => setFilter('grn', 'search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={v => setFilter('grn', 'status', v)}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={() => resetFilters('grn')}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<Grn>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="GRNs"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/purchase/grn/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

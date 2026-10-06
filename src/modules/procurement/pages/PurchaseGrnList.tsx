import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Grn } from '@/types/procurement'
import { GrnFormDrawer } from '../components/GrnFormDrawer'
import { GRN_STATUS_BADGE, GRN_STATUS_LABELS } from '../constants'
import { useGrns } from '../hooks/usePurchaseGrns'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

const STATUS_OPTIONS = Object.entries(GRN_STATUS_LABELS).map(([value, label]) => ({ value, label }))

interface RowActions {
  onView: (record: Grn) => void
  onEdit: (record: Grn) => void
}

const getColumns = ({ onView, onEdit }: RowActions): TableColumnsType<Grn> => [
  {
    title: 'GRN No / Date',
    key: 'grnNo',
    width: 140,
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 600 }}>{record.grnNo}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.grnDate}</div>
      </div>
    ),
  },
  { title: 'Supplier', dataIndex: 'supplierName', key: 'supplierName' },
  {
    title: 'Item Code',
    key: 'itemCode',
    render: (_, record) => {
      if (!record.items.length) return '—'
      return record.items[0]?.itemCode ?? '—'
    },
  },
  {
    title: 'Item Name',
    key: 'itemName',
    render: (_, record) => {
      if (!record.items.length) return '—'
      return record.items[0]?.itemName ?? record.items[0]?.itemId ?? '—'
    },
  },
  {
    title: 'Qty',
    key: 'qty',
    align: 'right' as const,
    width: 80,
    render: (_, record) => {
      if (!record.items.length) return '—'
      const totalQty = record.items.reduce((sum, item) => sum + (item.orderedQty ?? 0), 0)
      return totalQty > 0 ? totalQty : '—'
    },
  },
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
    width: 110,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="View">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
        </Tooltip>
        <Tooltip title="Edit">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
        </Tooltip>
      </Space>
    ),
  },
]

export const PurchaseGrnList: FC = () => {
  const navigate = useNavigate()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const { data: grns, isLoading } = useGrns()
  const filters = useProcurementFilters('grn')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const columns = getColumns({
    onView: record => navigate(`/purchase/grn/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
  })

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
            onClick={() => setDrawerState({ mode: 'add' })}
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

      <GrnFormDrawer
        open={!!drawerState}
        grnId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />
    </div>
  )
}

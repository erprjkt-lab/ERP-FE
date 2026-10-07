import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { GrnItemRow, GrnLineStatus } from '@/types/procurement'
import { GrnFormDrawer } from '../components/GrnFormDrawer'
import { GRN_LINE_STATUS_BADGE, GRN_LINE_STATUS_LABELS } from '../constants'
import { useGrnItems } from '../hooks/usePurchaseGrns'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

const STATUS_OPTIONS = Object.entries(GRN_LINE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface RowActions {
  onView: (record: GrnItemRow) => void
  onEdit: (record: GrnItemRow) => void
}

const getColumns = ({ onView, onEdit }: RowActions): TableColumnsType<GrnItemRow> => [
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
  { title: 'Supplier', dataIndex: 'supplierName', key: 'supplierName', render: v => v ?? '—' },
  { title: 'PO No', dataIndex: 'poNumber', key: 'poNumber', render: v => v ?? '—' },
  { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode', render: v => v ?? '—' },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  {
    title: 'Received Qty',
    dataIndex: 'receivedQty',
    key: 'receivedQty',
    align: 'right' as const,
    width: 110,
  },
  {
    title: 'Accepted',
    dataIndex: 'acceptedQty',
    key: 'acceptedQty',
    align: 'right' as const,
    width: 90,
    render: v => v ?? '—',
  },
  {
    title: 'Rejected',
    dataIndex: 'rejectedQty',
    key: 'rejectedQty',
    align: 'right' as const,
    width: 90,
    render: v => v ?? '—',
  },
  { title: 'Location', dataIndex: 'locationName', key: 'locationName', render: v => v ?? '—' },
  {
    title: 'Status',
    dataIndex: 'lineStatus',
    key: 'lineStatus',
    render: status => (
      <StatusBadge
        status={GRN_LINE_STATUS_BADGE[status as GrnLineStatus]}
        label={GRN_LINE_STATUS_LABELS[status as GrnLineStatus]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 110,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="View GRN">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
        </Tooltip>
        <Tooltip title="Edit GRN">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
        </Tooltip>
      </Space>
    ),
  },
]

export const PurchaseGrnList: FC = () => {
  const navigate = useNavigate()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const filters = useProcurementFilters('grn')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)
  // Status is filtered server-side (line status); search only narrows the loaded page.
  const {
    data: items,
    meta,
    isLoading,
    isFetching,
  } = useGrnItems({ page, perPage: pageSize, status: filters.status })

  const columns = getColumns({
    onView: record => navigate(`/purchase/grn/${record.grnId}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.grnId }),
  })

  const filtered = items.filter(
    row => !filters.search || row.grnNo.toLowerCase().includes(filters.search.toLowerCase()),
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Goods Receipt Notes"
        subtitle={`${meta?.total ?? 0} GRN items`}
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
              onChange={v => {
                setFilter('grn', 'status', v ?? null)
                setPage(1)
              }}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button
              onClick={() => {
                resetFilters('grn')
                setPage(1)
              }}
            >
              Clear filters
            </Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<GrnItemRow>
          columns={columns}
          dataSource={filtered}
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
          totalLabel="GRN items"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/purchase/grn/${record.grnId}`),
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

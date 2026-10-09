import {
  DiffOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { App, Badge, Button, Card, Input, Segmented, Select, Space } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui/TableActionBar'
import type {
  PurchaseEnquiryItemRow,
  PurchaseEnquiryStatus,
  PurchaseOrder,
} from '@/types/procurement'
import { PurchaseEnquiryFormDrawer } from '../components/PurchaseEnquiryFormDrawer'
import { QuotationComparisonDrawer } from '../components/QuotationComparisonDrawer'
import { SupplierQuotationFormDrawer } from '../components/SupplierQuotationFormDrawer'
import { ENQUIRY_STATUS_BADGE, ENQUIRY_STATUS_GROUPS, ENQUIRY_STATUS_LABELS } from '../constants'
import { usePurchaseEnquiryItems } from '../hooks/usePurchaseEnquiries'
import { useCreatePurchaseOrderFromEnquiry, usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'
import { getErrorMessage } from '@/api/client'

const ENQUIRY_STATUSES = Object.keys(ENQUIRY_STATUS_LABELS) as PurchaseEnquiryStatus[]

const ALL = 'all'
const GROUP_BADGE_COLOR: Record<string, string> = {
  [ALL]: '#0289C3',
  pending: '#fa8c16',
  completed: '#52c41a',
  cancelled: '#bfbfbf',
}

// Same LOCKED_STATUSES as ERP-BE's PurchaseEnquiryService::updateEnquiry — don't
// show a dead Edit button on a row that will just bounce off the drawer's own lock check.
const LOCKED_STATUSES: PurchaseEnquiryStatus[] = [
  'SUPPLIER_SELECTED',
  'PO_CREATED',
  'CLOSED',
  'CANCELLED',
]

interface RowActions {
  onView: (record: PurchaseEnquiryItemRow) => void
  onEdit: (record: PurchaseEnquiryItemRow) => void
  onCompare: (record: PurchaseEnquiryItemRow) => void
  onCreatePO: (record: PurchaseEnquiryItemRow) => void
  onViewPO: (order: PurchaseOrder) => void
  onRecordQuotation: (record: PurchaseEnquiryItemRow) => void
}

const getEnquiryActions = (
  record: PurchaseEnquiryItemRow,
  a: RowActions,
  purchaseOrders: PurchaseOrder[],
): TableActionItem[] => {
  const linkedOrder = purchaseOrders.find(po => po.purchaseEnquiryId === record.purchaseEnquiryId)
  const canCompare = record.status !== 'SENT'
  const canRecordQuotation = !LOCKED_STATUSES.includes(record.status)

  const actions: TableActionItem[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <EyeOutlined />,
      variant: 'default',
      onClick: () => a.onView(record),
    },
  ]

  if (!LOCKED_STATUSES.includes(record.status)) {
    actions.push({
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      variant: 'primary',
      onClick: () => a.onEdit(record),
    })
  }

  if (canRecordQuotation) {
    actions.push({
      key: 'supplier-quotation',
      label: 'Supplier Quotation',
      icon: <FileTextOutlined />,
      variant: 'primary',
      onClick: () => a.onRecordQuotation(record),
    })
  }

  if (canCompare) {
    actions.push({
      key: 'compare',
      label: 'Compare Quotations',
      icon: <DiffOutlined />,
      variant: 'accent',
      onClick: () => a.onCompare(record),
    })
  }

  if (record.status === 'SUPPLIER_SELECTED') {
    actions.push({
      key: 'create-po',
      label: 'Create Purchase Order',
      icon: <ShoppingCartOutlined />,
      variant: 'success',
      onClick: () => a.onCreatePO(record),
    })
  }

  if (linkedOrder) {
    actions.push({
      key: 'view-po',
      label: 'View Purchase Order',
      icon: <LinkOutlined />,
      variant: 'accent',
      onClick: () => a.onViewPO(linkedOrder),
    })
  }

  return actions
}

const getColumns = (): TableColumnsType<PurchaseEnquiryItemRow> => [
  {
    title: 'P.E. No / Date',
    key: 'peNumber',
    width: 140,
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 600 }}>{record.enquiryNumber}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.enquiryDate}</div>
      </div>
    ),
  },
  { title: 'Due Date', dataIndex: 'enquiryDueDate', key: 'enquiryDueDate', render: v => v ?? '—' },
  { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode', render: v => v ?? '—' },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  {
    title: 'Required Qty',
    dataIndex: 'requiredQty',
    key: 'requiredQty',
    align: 'right' as const,
    width: 110,
  },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
  { title: 'Required Date', dataIndex: 'requiredDate', key: 'requiredDate', render: v => v ?? '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => (
      <StatusBadge
        status={ENQUIRY_STATUS_BADGE[status as PurchaseEnquiryStatus]}
        label={ENQUIRY_STATUS_LABELS[status as PurchaseEnquiryStatus]}
      />
    ),
  },
]

export const PurchaseEnquiryList: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const [quotationEnquiryId, setQuotationEnquiryId] = useState<string>()
  const [compareEnquiryId, setCompareEnquiryId] = useState<string>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const filters = useProcurementFilters('enquiry')
  // Status is filtered server-side; search only narrows the loaded page.
  const {
    data: items,
    meta,
    isLoading,
    isFetching,
  } = usePurchaseEnquiryItems({ page, perPage: pageSize, status: filters.status })
  // Header-level lookup, only to link an enquiry row to the PO raised from it.
  const { data: purchaseOrders } = usePurchaseOrders()
  const { mutateAsync: createPO } = useCreatePurchaseOrderFromEnquiry()
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const handleCreatePO = async (record: PurchaseEnquiryItemRow) => {
    try {
      const po = await createPO({ enquiryId: record.purchaseEnquiryId })
      message.success('Purchase order created')
      navigate(`/purchase/orders/${po.id}`)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const rowActions: RowActions = {
    onView: record => navigate(`/purchase/enquiries/${record.purchaseEnquiryId}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.purchaseEnquiryId }),
    onCompare: record => setCompareEnquiryId(record.purchaseEnquiryId),
    onCreatePO: handleCreatePO,
    onViewPO: order => navigate(`/purchase/orders/${order.id}`),
    onRecordQuotation: record => setQuotationEnquiryId(record.purchaseEnquiryId),
  }

  const columns = getColumns()

  // TODO(BE): the BE filters by a single status, so the quick-filter groups (several
  // statuses each) and their counts apply to the rows of the loaded page. Once it accepts
  // multiple statuses, send the group's statuses with the request and read counts from it.
  const searched = items.filter(
    row =>
      !filters.search || row.enquiryNumber.toLowerCase().includes(filters.search.toLowerCase()),
  )
  const activeGroup = ENQUIRY_STATUS_GROUPS.find(g => g.value === filters.group)
  const filtered = searched.filter(row => !activeGroup || activeGroup.statuses.includes(row.status))
  const quickFilterOptions = [
    { value: ALL, label: 'All', count: searched.length },
    ...ENQUIRY_STATUS_GROUPS.map(g => ({
      value: g.value,
      label: g.label,
      count: searched.filter(row => g.statuses.includes(row.status)).length,
    })),
  ].map(o => ({
    value: o.value,
    label: (
      <Space size={6}>
        {o.label}
        <Badge count={o.count} showZero overflowCount={999} color={GROUP_BADGE_COLOR[o.value]} />
      </Space>
    ),
  }))
  const statusOptions = ENQUIRY_STATUSES.map(value => ({
    value,
    label: ENQUIRY_STATUS_LABELS[value],
  }))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Purchase Enquiries"
        subtitle={`${meta?.total ?? 0} enquiry items`}
        breadcrumbs={[{ label: 'Purchase', href: '/purchase' }, { label: 'Enquiries' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerState({ mode: 'add' })}
          >
            New Enquiry
          </Button>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Input.Search
            placeholder="Search by enquiry #..."
            value={filters.search}
            onChange={e => setFilter('enquiry', 'search', e.target.value)}
            allowClear
            style={{ flex: '1 1 200px', maxWidth: 280 }}
          />
          {/* Quick filter and status dropdown are alternatives — picking one clears the other. */}
          <Segmented
            value={activeGroup?.value ?? (filters.status ? '' : ALL)}
            onChange={v => {
              setFilter('enquiry', 'group', v === ALL ? null : (v as string))
              setFilter('enquiry', 'status', null)
              setPage(1)
            }}
            options={quickFilterOptions}
          />
          <Select
            placeholder="All statuses"
            value={filters.status}
            onChange={v => {
              setFilter('enquiry', 'status', v ?? null)
              setFilter('enquiry', 'group', null)
              setPage(1)
            }}
            allowClear
            style={{ width: 170 }}
            options={statusOptions}
          />
          {/* Always rendered (just hidden) so toggling it never reflows the row. */}
          <Button
            type="link"
            onClick={() => {
              resetFilters('enquiry')
              setPage(1)
            }}
            style={{
              padding: 0,
              visibility: activeGroup || filters.status || filters.search ? 'visible' : 'hidden',
            }}
          >
            Clear filters
          </Button>
        </div>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<PurchaseEnquiryItemRow>
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
          totalLabel="enquiry items"
          fillHeight
          rowActions={record => getEnquiryActions(record, rowActions, purchaseOrders)}
          onRow={record => ({
            onClick: () => navigate(`/purchase/enquiries/${record.purchaseEnquiryId}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <PurchaseEnquiryFormDrawer
        open={!!drawerState}
        enquiryId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />

      <SupplierQuotationFormDrawer
        open={!!quotationEnquiryId}
        enquiryId={quotationEnquiryId}
        onClose={() => setQuotationEnquiryId(undefined)}
      />

      <QuotationComparisonDrawer
        open={!!compareEnquiryId}
        enquiryId={compareEnquiryId}
        onClose={() => setCompareEnquiryId(undefined)}
      />
    </div>
  )
}

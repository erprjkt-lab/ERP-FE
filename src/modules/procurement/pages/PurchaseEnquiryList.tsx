import {
  DiffOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
  SendOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { App, Badge, Button, Card, Input, Segmented, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PurchaseEnquiry, PurchaseOrder } from '@/types/procurement'
import { PurchaseEnquiryFormDrawer } from '../components/PurchaseEnquiryFormDrawer'
import { QuotationComparisonDrawer } from '../components/QuotationComparisonDrawer'
import { SupplierQuotationFormDrawer } from '../components/SupplierQuotationFormDrawer'
import { ENQUIRY_STATUS_BADGE, ENQUIRY_STATUS_GROUPS, ENQUIRY_STATUS_LABELS } from '../constants'
import { usePurchaseEnquiries, useSendPurchaseEnquiry } from '../hooks/usePurchaseEnquiries'
import { useCreatePurchaseOrderFromEnquiry, usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'
import { getErrorMessage } from '@/api/client'

const ENQUIRY_STATUSES = Object.keys(ENQUIRY_STATUS_LABELS) as PurchaseEnquiry['status'][]

const ALL = 'all'
const GROUP_BADGE_COLOR: Record<string, string> = {
  [ALL]: '#1677ff',
  pending: '#fa8c16',
  completed: '#52c41a',
  cancelled: '#bfbfbf',
}

// Same LOCKED_STATUSES as ERP-BE's PurchaseEnquiryService::updateEnquiry — don't
// show a dead Edit button on a row that will just bounce off the drawer's own lock check.
const LOCKED_STATUSES: PurchaseEnquiry['status'][] = [
  'SUPPLIER_SELECTED',
  'PO_CREATED',
  'CLOSED',
  'CANCELLED',
]

interface RowActions {
  onView: (record: PurchaseEnquiry) => void
  onEdit: (record: PurchaseEnquiry) => void
  onSend: (record: PurchaseEnquiry) => void
  onCompare: (record: PurchaseEnquiry) => void
  onCreatePO: (record: PurchaseEnquiry) => void
  onViewPO: (order: PurchaseOrder) => void
  onRecordQuotation: (record: PurchaseEnquiry) => void
}

const action = (title: string, icon: ReactNode, onClick: () => void) => (
  <Tooltip title={title} key={title}>
    <Button type="text" size="small" icon={icon} onClick={onClick} />
  </Tooltip>
)

const getColumns = (
  a: RowActions,
  purchaseOrders: PurchaseOrder[],
): TableColumnsType<PurchaseEnquiry> => [
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
      const totalQty = record.items.reduce((sum, item) => sum + item.requiredQty, 0)
      return totalQty > 0 ? totalQty : '—'
    },
  },
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
    width: 260,
    render: (_, record) => {
      const linkedOrder = purchaseOrders.find(po => po.purchaseEnquiryId === record.id)
      const canCompare = record.status !== 'DRAFT' && record.status !== 'SENT'
      // Mirrors the Detail page's per-supplier "Record Quotation" action — only
      // makes sense once sent, and ERP-BE's SupplierQuotationService::update
      // rejects edits once a supplier's been selected (LOCKED_STATUSES).
      const canRecordQuotation =
        record.status !== 'DRAFT' &&
        !LOCKED_STATUSES.includes(record.status) &&
        record.suppliers.length > 0
      return (
        <Space size="small" onClick={e => e.stopPropagation()}>
          {action('View', <EyeOutlined />, () => a.onView(record))}
          {!LOCKED_STATUSES.includes(record.status) &&
            action('Edit', <EditOutlined />, () => a.onEdit(record))}
          {record.status === 'DRAFT' &&
            action('Send Enquiry', <SendOutlined />, () => a.onSend(record))}
          {canRecordQuotation &&
            action('Record Quotation', <FileTextOutlined />, () => a.onRecordQuotation(record))}
          {canCompare && action('Compare Quotations', <DiffOutlined />, () => a.onCompare(record))}
          {record.status === 'SUPPLIER_SELECTED' &&
            action('Create Purchase Order', <ShoppingCartOutlined />, () => a.onCreatePO(record))}
          {linkedOrder &&
            action('View Purchase Order', <LinkOutlined />, () => a.onViewPO(linkedOrder))}
        </Space>
      )
    },
  },
]

export const PurchaseEnquiryList: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const [quotationEnquiryId, setQuotationEnquiryId] = useState<string>()
  const [compareEnquiryId, setCompareEnquiryId] = useState<string>()
  const { data: enquiries, isLoading } = usePurchaseEnquiries()
  const { data: purchaseOrders } = usePurchaseOrders()
  const { mutateAsync: sendEnquiry } = useSendPurchaseEnquiry()
  const { mutateAsync: createPO } = useCreatePurchaseOrderFromEnquiry()
  const filters = useProcurementFilters('enquiry')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const handleSend = async (record: PurchaseEnquiry) => {
    try {
      await sendEnquiry(record.id)
      message.success('Purchase enquiry sent to suppliers')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleCreatePO = async (record: PurchaseEnquiry) => {
    try {
      const po = await createPO({ enquiryId: record.id })
      message.success('Purchase order created')
      navigate(`/purchase/orders/${po.id}`)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns = getColumns(
    {
      onView: record => navigate(`/purchase/enquiries/${record.id}`),
      onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
      onSend: handleSend,
      onCompare: record => setCompareEnquiryId(record.id),
      onCreatePO: handleCreatePO,
      onViewPO: order => navigate(`/purchase/orders/${order.id}`),
      onRecordQuotation: record => setQuotationEnquiryId(record.id),
    },
    purchaseOrders,
  )

  const searched = enquiries.filter(
    pe => !filters.search || pe.enquiryNumber.toLowerCase().includes(filters.search.toLowerCase()),
  )
  const activeGroup = ENQUIRY_STATUS_GROUPS.find(g => g.value === filters.group)
  const filtered = searched.filter(
    pe =>
      (!activeGroup || activeGroup.statuses.includes(pe.status)) &&
      (!filters.status || pe.status === filters.status),
  )
  const statusOptions = ENQUIRY_STATUSES.map(value => ({
    value,
    label: ENQUIRY_STATUS_LABELS[value],
  }))
  const quickFilterOptions = [
    { value: ALL, label: 'All', count: searched.length },
    ...ENQUIRY_STATUS_GROUPS.map(g => ({
      value: g.value,
      label: g.label,
      count: searched.filter(pe => g.statuses.includes(pe.status)).length,
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
            }}
            options={quickFilterOptions}
          />
          <Select
            placeholder="All statuses"
            value={filters.status}
            onChange={v => {
              setFilter('enquiry', 'status', v ?? null)
              setFilter('enquiry', 'group', null)
            }}
            allowClear
            style={{ width: 170 }}
            options={statusOptions}
          />
          {/* Always rendered (just hidden) so toggling it never reflows the row. */}
          <Button
            type="link"
            onClick={() => resetFilters('enquiry')}
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

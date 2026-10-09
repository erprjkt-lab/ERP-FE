import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Tabs } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui/TableActionBar'
import type { PurchaseRequisition } from '@/types/procurement'
import { PurchaseEnquiryFormDrawer } from '../components/PurchaseEnquiryFormDrawer'
import { PurchaseRequisitionFormDrawer } from '../components/PurchaseRequisitionFormDrawer'
import { REQUISITION_STATUS_BADGE, REQUISITION_STATUS_LABELS } from '../constants'
import type { RequisitionDisplayStatus } from '../constants'
import {
  hasEnquiryCreated,
  requisitionDisplayStatus,
  useApproveRequisition,
  useDeletePurchaseRequisition,
  useFetchPurchaseRequisition,
  usePurchaseRequisitions,
  useRejectRequisition,
} from '../hooks/usePurchaseRequisitions'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'
import { getErrorMessage } from '@/api/client'

const STATUS_TABS = Object.keys(REQUISITION_STATUS_LABELS) as RequisitionDisplayStatus[]

interface RowActions {
  onView: (record: PurchaseRequisition) => void
  onEdit: (record: PurchaseRequisition) => void
  onDelete: (record: PurchaseRequisition) => void
  onApprove: (record: PurchaseRequisition) => void
  onReject: (record: PurchaseRequisition) => void
  onCreateEnquiry: (record: PurchaseRequisition) => void
}

const getRequisitionActions = (record: PurchaseRequisition, a: RowActions): TableActionItem[] => {
  const status = requisitionDisplayStatus(record)
  const actions: TableActionItem[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <EyeOutlined />,
      variant: 'default',
      onClick: () => a.onView(record),
    },
  ]

  if (status === 'PENDING_APPROVAL') {
    actions.push(
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        variant: 'primary',
        onClick: () => a.onEdit(record),
      },
      {
        key: 'approve',
        label: 'Approve',
        icon: <CheckOutlined />,
        variant: 'success',
        onClick: () => a.onApprove(record),
      },
      {
        key: 'reject',
        label: 'Reject',
        icon: <CloseOutlined />,
        variant: 'danger',
        danger: true,
        onClick: () => a.onReject(record),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        variant: 'danger',
        danger: true,
        onClick: () => a.onDelete(record),
      },
    )
  } else if (status === 'APPROVED') {
    actions.push({
      key: 'create-enquiry',
      label: 'Create Enquiry',
      icon: <FileSearchOutlined />,
      variant: 'accent',
      onClick: () => a.onCreateEnquiry(record),
    })
  }

  return actions
}

const getColumns = (): TableColumnsType<PurchaseRequisition> => [
  {
    title: 'P.R. No / Date',
    key: 'prNumber',
    width: 140,
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 600 }}>{record.requisitionNumber}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{record.requisitionDate}</div>
      </div>
    ),
  },
  {
    title: 'Department',
    dataIndex: 'departmentName',
    key: 'departmentName',
    render: v => v ?? '—',
  },
  { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 90 },
  {
    title: 'Item Code',
    key: 'itemCode',
    // NOTE: items array is populated once BE's PurchaseRequisitionRepository::findAll()
    // includes items in the with() clause. Until then, always empty on list page.
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
  {
    title: 'Status',
    key: 'status',
    render: (_, record) => {
      const status = requisitionDisplayStatus(record)
      return (
        <StatusBadge
          status={REQUISITION_STATUS_BADGE[status]}
          label={REQUISITION_STATUS_LABELS[status]}
        />
      )
    },
  },
]

export const PurchaseRequisitionList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const [createEnquiryFromPrId, setCreateEnquiryFromPrId] = useState<string>()
  const { data: requisitions, isLoading } = usePurchaseRequisitions()
  const { mutateAsync: deleteRequisition } = useDeletePurchaseRequisition()
  const { mutateAsync: approve } = useApproveRequisition()
  const { mutateAsync: reject } = useRejectRequisition()
  const fetchRequisition = useFetchPurchaseRequisition()
  const filters = useProcurementFilters('requisition')
  const setFilter = useProcurementStore(s => s.setFilter)

  const run = async (task: () => Promise<unknown>, success: string) => {
    try {
      await task()
      message.success(success)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const rowActions: RowActions = {
    onView: record => navigate(`/purchase/requisitions/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onDelete: record =>
      modal.confirm({
        title: `Delete ${record.requisitionNumber}?`,
        content: 'This action cannot be undone.',
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: () => run(() => deleteRequisition(record.id), 'Purchase requisition deleted'),
      }),
    onApprove: record =>
      modal.confirm({
        title: `Approve ${record.requisitionNumber}?`,
        okText: 'Approve',
        onOk: () => run(() => approve(record.id), 'Requisition approved'),
      }),
    onReject: record => {
      let reason = ''
      modal.confirm({
        title: `Reject ${record.requisitionNumber}?`,
        content: (
          <Input.TextArea
            placeholder="Reason for rejection"
            rows={3}
            onChange={e => {
              reason = e.target.value
            }}
          />
        ),
        okText: 'Reject',
        okButtonProps: { danger: true },
        onOk: () => run(() => reject({ id: record.id, reason }), 'Requisition rejected'),
      })
    },
    // The list endpoint doesn't return items, so check pending qty before
    // opening the enquiry form rather than letting the backend reject it.
    onCreateEnquiry: async record => {
      try {
        const full = await fetchRequisition(record.id)
        if (hasEnquiryCreated(full)) {
          message.info(`An enquiry has already been created for ${record.requisitionNumber}`)
          return
        }
        setCreateEnquiryFromPrId(record.id)
      } catch (error) {
        message.error(getErrorMessage(error))
      }
    },
  }

  const columns = getColumns()

  const searched = requisitions.filter(
    pr =>
      !filters.search || pr.requisitionNumber.toLowerCase().includes(filters.search.toLowerCase()),
  )
  const countByStatus = searched.reduce<Record<string, number>>((acc, pr) => {
    const status = requisitionDisplayStatus(pr)
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})
  const filtered = filters.status
    ? searched.filter(pr => requisitionDisplayStatus(pr) === filters.status)
    : searched

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Purchase Requisitions"
        subtitle={`${filtered.length} of ${requisitions.length} requisitions`}
        breadcrumbs={[{ label: 'Purchase', href: '/purchase' }, { label: 'Requisitions' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerState({ mode: 'add' })}
          >
            New Requisition
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by requisition #..."
              value={filters.search}
              onChange={e => setFilter('requisition', 'search', e.target.value)}
              allowClear
            />
          </Col>
        </Row>
        <Tabs
          activeKey={filters.status ?? 'ALL'}
          onChange={key => setFilter('requisition', 'status', key === 'ALL' ? null : key)}
          items={[
            { key: 'ALL', label: `All (${searched.length})` },
            ...STATUS_TABS.map(status => ({
              key: status,
              label: `${REQUISITION_STATUS_LABELS[status]} (${countByStatus[status] ?? 0})`,
            })),
          ]}
        />
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<PurchaseRequisition>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="requisitions"
          fillHeight
          rowActions={record => getRequisitionActions(record, rowActions)}
          onRow={record => ({
            onClick: () => navigate(`/purchase/requisitions/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <PurchaseRequisitionFormDrawer
        open={!!drawerState}
        requisitionId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />

      <PurchaseEnquiryFormDrawer
        open={!!createEnquiryFromPrId}
        fromRequisitionId={createEnquiryFromPrId}
        onClose={() => setCreateEnquiryFromPrId(undefined)}
      />
    </div>
  )
}

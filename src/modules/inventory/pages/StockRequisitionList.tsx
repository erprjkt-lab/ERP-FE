import {
  CheckOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StockRequisition } from '@/types/inventory'
import { StockRequisitionFormDrawer } from '../components/StockRequisitionFormDrawer'
import { STOCK_REQUISITION_STATUS_BADGE, STOCK_REQUISITION_STATUS_LABELS } from '../constants'
import {
  useApproveStockRequisition,
  useCancelStockRequisition,
  useCloseStockRequisition,
  useDeleteStockRequisition,
  useRejectStockRequisition,
  useStockRequisitions,
  useSubmitStockRequisition,
} from '../hooks/useStockRequisitions'
import { useInventoryFilters, useInventoryStore } from '../store/inventoryStore'

const STATUS_OPTIONS = Object.entries(STOCK_REQUISITION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const action = (title: string, icon: ReactNode, onClick: () => void, danger = false) => (
  <Tooltip title={title} key={title}>
    <Button type="text" size="small" danger={danger} icon={icon} onClick={onClick} />
  </Tooltip>
)

interface RowActions {
  onView: (record: StockRequisition) => void
  onEdit: (record: StockRequisition) => void
  onSubmit: (record: StockRequisition) => void
  onApprove: (record: StockRequisition) => void
  onReject: (record: StockRequisition) => void
  onClose: (record: StockRequisition) => void
  onCancel: (record: StockRequisition) => void
  onDelete: (record: StockRequisition) => void
}

const getColumns = (a: RowActions): TableColumnsType<StockRequisition> => [
  { title: 'Requisition #', dataIndex: 'requisitionNumber', key: 'requisitionNumber', width: 150 },
  { title: 'Date', dataIndex: 'requisitionDate', key: 'requisitionDate', width: 110 },
  {
    title: 'Department',
    dataIndex: 'departmentName',
    key: 'departmentName',
    width: 140,
    render: v => v ?? '—',
  },
  {
    title: 'Items',
    key: 'items',
    render: (_: unknown, record: StockRequisition) => {
      const names = record.items.map(i => i.itemName ?? i.itemCode ?? '—').filter(Boolean)
      if (names.length === 0) return '—'
      const preview = names.slice(0, 2).join(', ')
      const extra = names.length > 2 ? ` +${names.length - 2} more` : ''
      return (
        <Tooltip title={names.join(', ')} placement="topLeft">
          <span style={{ cursor: 'default' }}>
            {preview}
            {extra}
          </span>
        </Tooltip>
      )
    },
  },
  { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 90 },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    render: status => (
      <StatusBadge
        status={STOCK_REQUISITION_STATUS_BADGE[status as StockRequisition['status']]}
        label={STOCK_REQUISITION_STATUS_LABELS[status as StockRequisition['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 200,
    render: (_, record) => {
      const isDraft = record.status === 'DRAFT'
      const isPending = record.status === 'PENDING_APPROVAL'
      const isApproved = record.status === 'APPROVED'
      const isFinished =
        record.status === 'CLOSED' || record.status === 'CANCELLED' || record.status === 'REJECTED'

      return (
        <Space size="small" onClick={e => e.stopPropagation()}>
          {action('View', <EyeOutlined />, () => a.onView(record))}
          {(isDraft || isPending) && action('Edit', <EditOutlined />, () => a.onEdit(record))}
          {isDraft && action('Submit for Approval', <SendOutlined />, () => a.onSubmit(record))}
          {isPending && action('Approve', <CheckOutlined />, () => a.onApprove(record))}
          {/* Reject = thumbs-down (workflow decision); Cancel = stop sign (abort the document) */}
          {isPending && action('Reject', <DislikeOutlined />, () => a.onReject(record), true)}
          {/* Lock = close/seal the requisition; CloseCircle = abort/cancel it */}
          {isApproved && action('Close Requisition', <LockOutlined />, () => a.onClose(record))}
          {!isFinished && action('Cancel', <CloseCircleOutlined />, () => a.onCancel(record), true)}
          {isDraft && action('Delete', <DeleteOutlined />, () => a.onDelete(record), true)}
        </Space>
      )
    },
  },
]

export const StockRequisitionList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: requisitions, isLoading } = useStockRequisitions()
  const { mutateAsync: deleteRequisition } = useDeleteStockRequisition()
  const { mutateAsync: submitForApproval } = useSubmitStockRequisition()
  const { mutateAsync: approve } = useApproveStockRequisition()
  const { mutateAsync: reject } = useRejectStockRequisition()
  const { mutateAsync: close } = useCloseStockRequisition()
  const { mutateAsync: cancel } = useCancelStockRequisition()
  const filters = useInventoryFilters('requisition')
  const setFilter = useInventoryStore(s => s.setFilter)
  const resetFilters = useInventoryStore(s => s.resetFilter)

  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()

  const handleSubmit = (record: StockRequisition) => {
    modal.confirm({
      title: 'Submit for approval?',
      content: 'The requisition will be sent for approval and can no longer be edited.',
      okText: 'Submit',
      onOk: async () => {
        try {
          await submitForApproval(record.id)
          message.success('Requisition submitted for approval')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleApprove = (record: StockRequisition) => {
    modal.confirm({
      title: 'Approve this requisition?',
      okText: 'Approve',
      onOk: async () => {
        try {
          await approve(record.id)
          message.success('Requisition approved')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleReject = (record: StockRequisition) => {
    const reason = { value: '' }
    modal.confirm({
      title: 'Reject this requisition?',
      content: (
        <Input.TextArea
          placeholder="Reason for rejection"
          rows={3}
          onChange={e => {
            reason.value = e.target.value
          }}
        />
      ),
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await reject({ id: record.id, remarks: reason.value || undefined })
          message.success('Requisition rejected')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleClose = (record: StockRequisition) => {
    modal.confirm({
      title: 'Close this requisition?',
      content: 'Any items with pending quantity will no longer be issuable.',
      okText: 'Close',
      onOk: async () => {
        try {
          await close(record.id)
          message.success('Requisition closed')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleCancel = (record: StockRequisition) => {
    const reason = { value: '' }
    modal.confirm({
      title: 'Cancel this requisition?',
      content: (
        <Input.TextArea
          placeholder="Reason (optional)"
          rows={3}
          onChange={e => {
            reason.value = e.target.value
          }}
        />
      ),
      okText: 'Cancel Requisition',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancel({ id: record.id, remarks: reason.value || undefined })
          message.success('Requisition cancelled')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleDelete = (record: StockRequisition) => {
    modal.confirm({
      title: 'Delete this requisition?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRequisition(record.id)
          message.success('Stock requisition deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns({
    onView: record => navigate(`/inventory/requisitions/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onSubmit: handleSubmit,
    onApprove: handleApprove,
    onReject: handleReject,
    onClose: handleClose,
    onCancel: handleCancel,
    onDelete: handleDelete,
  })

  const filtered = requisitions.filter(sr => {
    if (
      filters.search &&
      !sr.requisitionNumber.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false
    }
    if (filters.status && sr.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Stock Requisitions"
        subtitle={`${filtered.length} of ${requisitions.length} requisitions`}
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Requisitions' }]}
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
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={v => setFilter('requisition', 'status', v)}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={() => resetFilters('requisition')}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<StockRequisition>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="requisitions"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/inventory/requisitions/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <StockRequisitionFormDrawer
        open={!!drawerState}
        requisitionId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />
    </div>
  )
}

import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DiffOutlined,
  EditOutlined,
  EyeOutlined,
  FileDoneOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tag, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesQuotation } from '@/types/sales'
import { SalesQuotationFormDrawer } from '../components/SalesQuotationFormDrawer'
import { QUOTATION_STATUS_BADGE, QUOTATION_STATUS_LABELS } from '../constants'
import { useCreateSalesOrderFromQuotation } from '../hooks/useSalesOrders'
import {
  useDeleteSalesQuotation,
  useSalesQuotationAction,
  useSalesQuotations,
} from '../hooks/useSalesQuotations'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(QUOTATION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// Same lock condition as Detail's isLocked comment — backend blocks edits
// once a quotation is accepted, rejected or revised.
const LOCKED_STATUSES: SalesQuotation['status'][] = ['ACCEPTED', 'REJECTED', 'REVISED']

interface RowActions {
  onView: (record: SalesQuotation) => void
  onEdit: (record: SalesQuotation) => void
  onAccept: (record: SalesQuotation) => void
  onReject: (record: SalesQuotation) => void
  onRevise: (record: SalesQuotation) => void
  onDelete: (record: SalesQuotation) => void
  onCreateOrder: (record: SalesQuotation) => void
}

const action = (title: string, icon: ReactNode, onClick: () => void, danger = false) => (
  <Tooltip title={title} key={title}>
    <Button type="text" size="small" danger={danger} icon={icon} onClick={onClick} />
  </Tooltip>
)

const getColumns = (a: RowActions): TableColumnsType<SalesQuotation> => [
  { title: 'Quotation #', dataIndex: 'quotationNumber', key: 'quotationNumber', width: 160 },
  {
    title: 'Rev',
    dataIndex: 'revisionNo',
    key: 'revisionNo',
    width: 70,
    render: (value: number) => (value > 0 ? <Tag color="blue">R{value}</Tag> : '—'),
  },
  { title: 'Date', dataIndex: 'quotationDate', key: 'quotationDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  {
    title: 'Source',
    key: 'source',
    width: 110,
    render: (_, r) => (r.salesEnquiryId ? 'From Enquiry' : 'Direct'),
  },
  {
    title: 'Valid Until',
    dataIndex: 'validUntil',
    key: 'validUntil',
    width: 120,
    render: v => v || '—',
  },
  {
    title: 'Net Amount',
    key: 'netAmount',
    width: 130,
    render: (_, r) => r.netAmount.toFixed(2),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={QUOTATION_STATUS_BADGE[status as SalesQuotation['status']]}
        label={QUOTATION_STATUS_LABELS[status as SalesQuotation['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 260,
    render: (_, record) => {
      const isSent = record.status === 'SENT'
      const isAccepted = record.status === 'ACCEPTED'
      return (
        <Space size="small" onClick={e => e.stopPropagation()}>
          {action('View', <EyeOutlined />, () => a.onView(record))}
          {!LOCKED_STATUSES.includes(record.status) &&
            action('Edit', <EditOutlined />, () => a.onEdit(record))}
          {isSent && action('Accept', <CheckOutlined />, () => a.onAccept(record))}
          {isSent && action('Reject', <CloseOutlined />, () => a.onReject(record), true)}
          {!isAccepted &&
            record.status !== 'REVISED' &&
            action('Revise', <DiffOutlined />, () => a.onRevise(record))}
          {isAccepted &&
            action('Create Sales Order', <FileDoneOutlined />, () => a.onCreateOrder(record))}
          {isSent && action('Delete', <DeleteOutlined />, () => a.onDelete(record), true)}
        </Space>
      )
    },
  },
]

export const SalesQuotationList: FC = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const status = useSalesStatusFilter('quotation')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()

  const {
    data: quotations,
    meta,
    isLoading,
    isFetching,
  } = useSalesQuotations({ page, perPage: pageSize, status })
  const { mutateAsync: runAction } = useSalesQuotationAction()
  const { mutateAsync: createOrder } = useCreateSalesOrderFromQuotation()
  const { mutateAsync: removeQuotation } = useDeleteSalesQuotation()

  // Status filtering happens server-side, so changing it has to send the
  // user back to page 1 — otherwise they can sit on a page number that
  // no longer exists in the filtered result set.
  const handleStatusChange = (value: string | null) => {
    setStatus('quotation', value ?? null)
    setPage(1)
  }

  const handleAction = async (
    record: SalesQuotation,
    actionName: 'accept' | 'revise',
    successMessage: string,
  ) => {
    try {
      const result = await runAction({ id: record.id, action: actionName })
      message.success(successMessage)
      // A revision is a brand-new quotation row — follow the user to it.
      if (actionName === 'revise' && result) navigate(`/sales/quotations/${result.id}`)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleReject = (record: SalesQuotation) => {
    // Plain object, not a ref — this closure is handed to getColumns during
    // render, and the react-hooks/refs rule flags a ref read reachable from there.
    const reason = { value: '' }
    modal.confirm({
      title: 'Reject this quotation?',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Reason (optional)"
          onChange={e => {
            reason.value = e.target.value
          }}
        />
      ),
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await runAction({ id: record.id, action: 'reject', reason: reason.value || null })
          message.success('Quotation rejected')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleCreateOrder = async (record: SalesQuotation) => {
    try {
      const order = await createOrder({ quotationId: record.id, payload: {} })
      message.success(`Sales order ${order.orderNumber} created`)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleDelete = (record: SalesQuotation) => {
    modal.confirm({
      title: `Delete ${record.quotationNumber}?`,
      content: 'This permanently removes the quotation and its items.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeQuotation(record.id)
          message.success('Quotation deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns({
    onView: record => navigate(`/sales/quotations/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onAccept: record => handleAction(record, 'accept', 'Quotation accepted'),
    onReject: handleReject,
    onRevise: record => handleAction(record, 'revise', 'Revision created'),
    onDelete: handleDelete,
    onCreateOrder: handleCreateOrder,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Quotations"
        subtitle={`${meta?.total ?? 0} quotations`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Quotation' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerState({ mode: 'add' })}
          >
            New Quotation
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
        <DataTable<SalesQuotation>
          columns={columns}
          dataSource={quotations}
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
          totalLabel="quotations"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/sales/quotations/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <SalesQuotationFormDrawer
        open={!!drawerState}
        quotationId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />
    </div>
  )
}

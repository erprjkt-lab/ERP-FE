import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Row, Select } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui'
import type { SalesEnquiryItemRow, SalesEnquiryStatus } from '@/types/sales'
import { SalesEnquiryFormDrawer } from '../components/SalesEnquiryFormDrawer'
import { SalesQuotationFormDrawer } from '../components/SalesQuotationFormDrawer'
import {
  ENQUIRY_STATUS_BADGE,
  ENQUIRY_STATUS_LABELS,
  FEASIBLE_STATUS_BADGE,
  FEASIBLE_STATUS_LABELS,
} from '../constants'
import {
  useCloseSalesEnquiry,
  useDeleteSalesEnquiry,
  useSalesEnquiryItems,
} from '../hooks/useSalesEnquiries'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface RowActions {
  onView: (record: SalesEnquiryItemRow) => void
  onEdit: (record: SalesEnquiryItemRow) => void
  onCreateQuotation: (record: SalesEnquiryItemRow) => void
  onClose: (record: SalesEnquiryItemRow) => void
  onDelete: (record: SalesEnquiryItemRow) => void
}

const getColumns = (): TableColumnsType<SalesEnquiryItemRow> => [
  { title: 'Enquiry #', dataIndex: 'enquiryNumber', key: 'enquiryNumber', width: 150 },
  { title: 'Date', dataIndex: 'enquiryDate', key: 'enquiryDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode', render: v => v ?? '—' },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 90, align: 'right' },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
  {
    title: 'Feasibility',
    dataIndex: 'feasibleStatus',
    key: 'feasibleStatus',
    width: 130,
    render: v => (
      <StatusBadge
        status={FEASIBLE_STATUS_BADGE[v as SalesEnquiryItemRow['feasibleStatus']]}
        label={FEASIBLE_STATUS_LABELS[v as SalesEnquiryItemRow['feasibleStatus']]}
      />
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={ENQUIRY_STATUS_BADGE[status as SalesEnquiryStatus]}
        label={ENQUIRY_STATUS_LABELS[status as SalesEnquiryStatus]}
      />
    ),
  },
]

const getEnquiryActions = (record: SalesEnquiryItemRow, a: RowActions): TableActionItem[] => {
  const isOpen = record.status === 'OPEN'
  const isClosed = record.status === 'CLOSED'
  const actions: TableActionItem[] = [
    {
      key: 'view',
      label: 'View',
      icon: <EyeOutlined />,
      variant: 'default',
      onClick: () => a.onView(record),
    },
  ]

  if (isOpen) {
    actions.push({
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      variant: 'primary',
      onClick: () => a.onEdit(record),
    })
  }

  if (!isClosed) {
    actions.push(
      {
        key: 'create-quote',
        label: 'Create Quotation',
        icon: <FileTextOutlined />,
        variant: 'accent',
        onClick: () => a.onCreateQuotation(record),
      },
      {
        key: 'close',
        label: 'Close',
        icon: <StopOutlined />,
        variant: 'danger',
        danger: true,
        onClick: () => a.onClose(record),
      },
    )
  }

  if (isOpen) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      variant: 'danger',
      danger: true,
      onClick: () => a.onDelete(record),
    })
  }

  return actions
}

export const SalesEnquiryList: FC = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const status = useSalesStatusFilter('enquiry')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const [quoteEnquiryId, setQuoteEnquiryId] = useState<string>()

  const {
    data: enquiryItems,
    meta,
    isLoading,
    isFetching,
  } = useSalesEnquiryItems({ page, perPage: pageSize, status })
  const { mutateAsync: closeEnquiry } = useCloseSalesEnquiry()
  const { mutateAsync: deleteEnquiry } = useDeleteSalesEnquiry()

  // Status filtering happens server-side, so changing it has to send the
  // user back to page 1 — otherwise they can sit on a page number that
  // no longer exists in the filtered result set.
  const handleStatusChange = (value: string | null) => {
    setStatus('enquiry', value ?? null)
    setPage(1)
  }

  const handleClose = (record: SalesEnquiryItemRow) => {
    modal.confirm({
      title: 'Close this enquiry?',
      content: 'A closed enquiry can no longer be edited or quoted against.',
      okText: 'Close Enquiry',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await closeEnquiry(record.salesEnquiryId)
          message.success('Sales enquiry closed')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  // The backend deliberately allows raising another quotation off an
  // already-quoted enquiry (re-quote after a rejection/expiry) rather than
  // force-closing it — so this stays enabled, just confirmed so it's clear
  // it's a new quotation, not a revision of the existing one.
  const handleCreateQuotation = (record: SalesEnquiryItemRow) => {
    const go = () => setQuoteEnquiryId(record.salesEnquiryId)
    if (record.status !== 'QUOTED') {
      go()
      return
    }
    modal.confirm({
      title: 'Create another quotation?',
      content:
        'This enquiry has already been quoted. This raises a separate, new quotation against the same enquiry — it does not revise the existing one.',
      okText: 'Create Quotation',
      onOk: go,
    })
  }

  const handleDelete = (record: SalesEnquiryItemRow) => {
    modal.confirm({
      title: `Delete ${record.enquiryNumber}?`,
      content: 'This permanently removes the enquiry and its items.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEnquiry(record.salesEnquiryId)
          message.success('Sales enquiry deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns()

  const rowActions: RowActions = {
    onView: record => navigate(`/sales/enquiries/${record.salesEnquiryId}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.salesEnquiryId }),
    onCreateQuotation: handleCreateQuotation,
    onClose: handleClose,
    onDelete: handleDelete,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Enquiries"
        subtitle={`${meta?.total ?? 0} enquiry items`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Sales Enquiry' }]}
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
        <DataTable<SalesEnquiryItemRow>
          columns={columns}
          dataSource={enquiryItems}
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
          rowActions={record => getEnquiryActions(record, rowActions)}
          onRow={record => ({
            onClick: () => navigate(`/sales/enquiries/${record.salesEnquiryId}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <SalesEnquiryFormDrawer
        open={!!drawerState}
        enquiryId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />

      <SalesQuotationFormDrawer
        open={!!quoteEnquiryId}
        sourceEnquiryId={quoteEnquiryId}
        onClose={() => setQuoteEnquiryId(undefined)}
      />
    </div>
  )
}

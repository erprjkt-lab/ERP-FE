import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesEnquiry } from '@/types/sales'
import { SalesEnquiryFormDrawer } from '../components/SalesEnquiryFormDrawer'
import { SalesQuotationFormDrawer } from '../components/SalesQuotationFormDrawer'
import { ENQUIRY_STATUS_BADGE, ENQUIRY_STATUS_LABELS } from '../constants'
import {
  useCloseSalesEnquiry,
  useDeleteSalesEnquiry,
  useSalesEnquiries,
} from '../hooks/useSalesEnquiries'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface RowActions {
  onView: (record: SalesEnquiry) => void
  onEdit: (record: SalesEnquiry) => void
  onCreateQuotation: (record: SalesEnquiry) => void
  onClose: (record: SalesEnquiry) => void
  onDelete: (record: SalesEnquiry) => void
}

const action = (title: string, icon: ReactNode, onClick: () => void, danger = false) => (
  <Tooltip title={title} key={title}>
    <Button type="text" size="small" danger={danger} icon={icon} onClick={onClick} />
  </Tooltip>
)

const getColumns = (a: RowActions): TableColumnsType<SalesEnquiry> => [
  { title: 'Enquiry #', dataIndex: 'enquiryNumber', key: 'enquiryNumber', width: 150 },
  { title: 'Date', dataIndex: 'enquiryDate', key: 'enquiryDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  { title: 'Ref By', dataIndex: 'refBy', key: 'refBy', width: 140, render: v => v || '—' },
  { title: 'Items', key: 'items', width: 80, render: (_, r) => r.items.length },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={ENQUIRY_STATUS_BADGE[status as SalesEnquiry['status']]}
        label={ENQUIRY_STATUS_LABELS[status as SalesEnquiry['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 220,
    render: (_, record) => {
      const isOpen = record.status === 'OPEN'
      const isClosed = record.status === 'CLOSED'
      return (
        <Space size="small" onClick={e => e.stopPropagation()}>
          {action('View', <EyeOutlined />, () => a.onView(record))}
          {/* Backend only allows edits/deletes while the enquiry is still OPEN. */}
          {isOpen && action('Edit', <EditOutlined />, () => a.onEdit(record))}
          {!isClosed &&
            action('Create Quotation', <FileTextOutlined />, () => a.onCreateQuotation(record))}
          {!isClosed && action('Close', <StopOutlined />, () => a.onClose(record), true)}
          {isOpen && action('Delete', <DeleteOutlined />, () => a.onDelete(record), true)}
        </Space>
      )
    },
  },
]

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
    data: enquiries,
    meta,
    isLoading,
    isFetching,
  } = useSalesEnquiries({ page, perPage: pageSize, status })
  const { mutateAsync: closeEnquiry } = useCloseSalesEnquiry()
  const { mutateAsync: deleteEnquiry } = useDeleteSalesEnquiry()

  // Status filtering happens server-side, so changing it has to send the
  // user back to page 1 — otherwise they can sit on a page number that
  // no longer exists in the filtered result set.
  const handleStatusChange = (value: string | null) => {
    setStatus('enquiry', value ?? null)
    setPage(1)
  }

  const handleClose = (record: SalesEnquiry) => {
    modal.confirm({
      title: 'Close this enquiry?',
      content: 'A closed enquiry can no longer be edited or quoted against.',
      okText: 'Close Enquiry',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await closeEnquiry(record.id)
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
  const handleCreateQuotation = (record: SalesEnquiry) => {
    const go = () => setQuoteEnquiryId(record.id)
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

  const handleDelete = (record: SalesEnquiry) => {
    modal.confirm({
      title: `Delete ${record.enquiryNumber}?`,
      content: 'This permanently removes the enquiry and its items.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEnquiry(record.id)
          message.success('Sales enquiry deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns({
    onView: record => navigate(`/sales/enquiries/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onCreateQuotation: handleCreateQuotation,
    onClose: handleClose,
    onDelete: handleDelete,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Enquiries"
        subtitle={`${meta?.total ?? 0} enquiries`}
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
        <DataTable<SalesEnquiry>
          columns={columns}
          dataSource={enquiries}
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
          totalLabel="enquiries"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/sales/enquiries/${record.id}`),
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

import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Dropdown, Row, Select, Space } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { downloadSalesInvoicePdf } from '@/api/salesInvoices'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui'
import type { SalesInvoice, SalesInvoiceStatus } from '@/types/sales'
import { SalesInvoiceDirectFormDrawer } from '../components/SalesInvoiceDirectFormDrawer'
import { SalesInvoiceFromChallanDrawer } from '../components/SalesInvoiceFromChallanDrawer'
import { INVOICE_STATUS_BADGE, INVOICE_STATUS_LABELS } from '../constants'
import {
  useCancelSalesInvoice,
  useDeleteSalesInvoice,
  usePostSalesInvoice,
  useSalesInvoices,
} from '../hooks/useSalesInvoices'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface RowActions {
  onView: (record: SalesInvoice) => void
  onDownload: (record: SalesInvoice) => void
  onPost: (record: SalesInvoice) => void
  onCancel: (record: SalesInvoice) => void
  onDelete: (record: SalesInvoice) => void
  busyId: string | undefined
}

const money = (value: number) => `₹${value.toFixed(2)}`

const getColumns = (): TableColumnsType<SalesInvoice> => [
  { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber', width: 160 },
  { title: 'Date', dataIndex: 'invoiceDate', key: 'invoiceDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  { title: 'GSTIN', dataIndex: 'gstin', key: 'gstin', width: 160, render: v => v ?? '—' },
  {
    title: 'Taxable',
    dataIndex: 'taxableAmount',
    key: 'taxableAmount',
    width: 120,
    align: 'right',
    render: money,
  },
  {
    title: 'Tax',
    dataIndex: 'taxAmount',
    key: 'taxAmount',
    width: 110,
    align: 'right',
    render: money,
  },
  {
    title: 'Net Amount',
    dataIndex: 'netAmount',
    key: 'netAmount',
    width: 130,
    align: 'right',
    render: money,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={INVOICE_STATUS_BADGE[status as SalesInvoiceStatus]}
        label={INVOICE_STATUS_LABELS[status as SalesInvoiceStatus]}
      />
    ),
  },
]

const getInvoiceActions = (record: SalesInvoice, a: RowActions): TableActionItem[] => {
  const actions: TableActionItem[] = [
    {
      key: 'view',
      label: 'View',
      icon: <EyeOutlined />,
      variant: 'default',
      onClick: () => a.onView(record),
    },
    {
      key: 'download',
      label: 'Download PDF',
      icon: <DownloadOutlined />,
      variant: 'default',
      loading: a.busyId === record.id,
      onClick: () => a.onDownload(record),
    },
  ]

  // Backend: post only from DRAFT, cancel only from POSTED, delete only DRAFT.
  if (record.status === 'DRAFT') {
    actions.push(
      {
        key: 'post',
        label: 'Post Invoice',
        icon: <CheckCircleOutlined />,
        variant: 'success',
        loading: a.busyId === record.id,
        onClick: () => a.onPost(record),
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
  }

  if (record.status === 'POSTED') {
    actions.push({
      key: 'cancel',
      label: 'Cancel Invoice',
      icon: <StopOutlined />,
      variant: 'danger',
      danger: true,
      loading: a.busyId === record.id,
      onClick: () => a.onCancel(record),
    })
  }

  return actions
}

export const SalesInvoiceList: FC = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const status = useSalesStatusFilter('invoice')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawer, setDrawer] = useState<'challan' | 'direct'>()
  const [busyId, setBusyId] = useState<string>()

  const {
    data: invoices,
    meta,
    isLoading,
    isFetching,
  } = useSalesInvoices({ page, perPage: pageSize, status })
  const { mutateAsync: runPost } = usePostSalesInvoice()
  const { mutateAsync: runCancel } = useCancelSalesInvoice()
  const { mutateAsync: runDelete } = useDeleteSalesInvoice()

  const handleStatusChange = (value: string | null) => {
    setStatus('invoice', value ?? null)
    setPage(1)
  }

  const runBusy = async (id: string, action: () => Promise<unknown>, successMessage: string) => {
    setBusyId(id)
    try {
      await action()
      message.success(successMessage)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setBusyId(undefined)
    }
  }

  const rowActions: RowActions = {
    onView: record => navigate(`/sales/invoices/${record.id}`),
    onDownload: record =>
      runBusy(
        record.id,
        () => downloadSalesInvoicePdf(Number(record.id), record.invoiceNumber),
        'Invoice PDF downloaded',
      ),
    onPost: record =>
      modal.confirm({
        title: `Post ${record.invoiceNumber}?`,
        content: 'A posted invoice can no longer be edited or deleted — only cancelled.',
        okText: 'Post Invoice',
        onOk: () => runBusy(record.id, () => runPost(record.id), 'Invoice posted'),
      }),
    onCancel: record =>
      modal.confirm({
        title: `Cancel ${record.invoiceNumber}?`,
        content:
          'This reverses the stock issued by this invoice and the billed quantity on its delivery challan lines.',
        okText: 'Cancel Invoice',
        okButtonProps: { danger: true },
        onOk: () => runBusy(record.id, () => runCancel(record.id), 'Invoice cancelled'),
      }),
    onDelete: record =>
      modal.confirm({
        title: `Delete ${record.invoiceNumber}?`,
        content: 'This action cannot be undone.',
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: () => runBusy(record.id, () => runDelete(record.id), 'Invoice deleted'),
      }),
    busyId,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Sales Invoices"
        subtitle={`${meta?.total ?? 0} invoices`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Sales Invoice' }]}
        actions={
          <Dropdown
            menu={{
              items: [
                { key: 'challan', label: 'From Delivery Challan' },
                { key: 'direct', label: 'Direct Invoice' },
              ],
              onClick: ({ key }) => setDrawer(key as 'challan' | 'direct'),
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              <Space>New Invoice</Space>
            </Button>
          </Dropdown>
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
        <DataTable<SalesInvoice>
          columns={getColumns()}
          dataSource={invoices}
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
          totalLabel="invoices"
          fillHeight
          rowActions={record => getInvoiceActions(record, rowActions)}
          onRow={record => ({
            onClick: () => navigate(`/sales/invoices/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <SalesInvoiceFromChallanDrawer
        open={drawer === 'challan'}
        onClose={() => setDrawer(undefined)}
      />
      <SalesInvoiceDirectFormDrawer
        open={drawer === 'direct'}
        onClose={() => setDrawer(undefined)}
      />
    </div>
  )
}

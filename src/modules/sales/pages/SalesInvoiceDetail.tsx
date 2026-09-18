import {
  ArrowLeftOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  FilePdfOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Space, Table, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { downloadSalesInvoicePdf } from '@/api/salesInvoices'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesInvoiceItem, StockLine } from '@/types/sales'
import { DetailFallback } from '../components/DetailFallback'
import { INVOICE_STATUS_BADGE, INVOICE_STATUS_LABELS } from '../constants'
import {
  useDeleteSalesInvoice,
  useSalesInvoice,
  useSalesInvoiceAction,
} from '../hooks/useSalesInvoices'

const STOCK_COLUMNS: TableColumnsType<StockLine> = [
  { title: 'Location', dataIndex: 'locationName', key: 'locationName', render: v => v ?? '—' },
  { title: 'Batch', dataIndex: 'batchNo', key: 'batchNo', render: v => v || '—' },
  { title: 'Heat', dataIndex: 'heatNo', key: 'heatNo', render: v => v || '—' },
  { title: 'Serial', dataIndex: 'serialNo', key: 'serialNo', render: v => v || '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 100 },
]

const ITEM_COLUMNS: TableColumnsType<SalesInvoiceItem> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, r) => (r.itemCode ? `${r.itemCode} — ${r.itemName}` : (r.itemName ?? r.itemId)),
  },
  {
    title: 'Source',
    key: 'source',
    width: 120,
    render: (_, r) => (r.deliveryChallanItemId ? 'Challan line' : 'Direct'),
  },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 90 },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
  { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 90 },
  {
    // Set only when the invoice overrode the challan's rate.
    title: 'Challan Rate',
    dataIndex: 'challanRate',
    key: 'challanRate',
    width: 120,
    render: v => v ?? '—',
  },
  { title: 'Disc %', dataIndex: 'discountPercent', key: 'discountPercent', width: 90 },
  { title: 'Tax %', dataIndex: 'taxPercent', key: 'taxPercent', width: 85 },
  {
    title: 'Line Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    width: 120,
    render: (value: number) => value.toFixed(2),
  },
]

export const SalesInvoiceDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: invoice, isLoading, error } = useSalesInvoice(id)
  const { mutateAsync: runAction, isPending } = useSalesInvoiceAction()
  const { mutateAsync: removeInvoice, isPending: deleting } = useDeleteSalesInvoice()
  const [downloading, setDownloading] = useState(false)

  if (!invoice) {
    return (
      <DetailFallback
        isLoading={isLoading}
        error={error}
        backTo="/sales/invoices"
        backLabel="Back to Sales Invoices"
        notFoundLabel="Sales invoice not found."
      />
    )
  }

  const isDraft = invoice.status === 'DRAFT'
  const isPosted = invoice.status === 'POSTED'
  const isFromChallan = invoice.items.some(item => item.deliveryChallanItemId)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadSalesInvoicePdf(Number(invoice.id), invoice.invoiceNumber)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not download the PDF')
    } finally {
      setDownloading(false)
    }
  }

  const confirmAction = (action: 'post' | 'cancel') => {
    const isPost = action === 'post'
    modal.confirm({
      title: isPost ? 'Post this invoice?' : `Cancel ${invoice.invoiceNumber}?`,
      content: isPost
        ? 'A posted invoice can no longer be edited or deleted.'
        : 'Cancelling reverses the invoice. This cannot be undone.',
      okText: isPost ? 'Post Invoice' : 'Cancel Invoice',
      okButtonProps: { danger: !isPost },
      onOk: async () => {
        try {
          await runAction({ id: invoice.id, action })
          message.success(isPost ? 'Sales invoice posted' : 'Sales invoice cancelled')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const handleDelete = () => {
    modal.confirm({
      title: `Delete ${invoice.invoiceNumber}?`,
      content: 'This permanently removes the draft invoice.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeInvoice(invoice.id)
          message.success('Sales invoice deleted')
          navigate('/sales/invoices')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={INVOICE_STATUS_LABELS[invoice.status]}
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Sales Invoice', href: '/sales/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/invoices')}>
              Back
            </Button>
            <Button icon={<FilePdfOutlined />} loading={downloading} onClick={handleDownload}>
              Download PDF
            </Button>
            {/* The update endpoint rebuilds lines from stock rows (the direct
                shape), so a challan-billed invoice can't go through it. */}
            <Tooltip
              title={
                isDraft && isFromChallan
                  ? 'A challan-billed invoice cannot be edited — cancel it and re-bill instead'
                  : undefined
              }
            >
              <Button
                icon={<EditOutlined />}
                disabled={!isDraft || isFromChallan}
                onClick={() => navigate(`/sales/invoices/${invoice.id}/edit`)}
              >
                Edit
              </Button>
            </Tooltip>
            <Button
              type={isDraft ? 'primary' : 'default'}
              icon={<CheckOutlined />}
              disabled={!isDraft}
              loading={isPending}
              onClick={() => confirmAction('post')}
            >
              Post
            </Button>
            {/* Backend only cancels a posted invoice, and only deletes a draft. */}
            <Button
              danger
              icon={<StopOutlined />}
              disabled={!isPosted}
              loading={isPending}
              onClick={() => confirmAction('cancel')}
            >
              Cancel
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!isDraft}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="Status">
                <StatusBadge
                  status={INVOICE_STATUS_BADGE[invoice.status]}
                  label={INVOICE_STATUS_LABELS[invoice.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Date">{invoice.invoiceDate}</Descriptions.Item>
              <Descriptions.Item label="Customer">
                {invoice.partyName ?? invoice.partyId}
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                {isFromChallan ? 'Billed against delivery challan' : 'Direct invoice'}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN">{invoice.gstin || '—'}</Descriptions.Item>
              <Descriptions.Item label="State Code">
                {invoice.partyStateCode || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Taxable Amount">
                {invoice.taxableAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Tax Amount">
                {invoice.taxAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Net Amount">
                <Typography.Text strong>{invoice.netAmount.toFixed(2)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Remarks" span={3}>
                {invoice.remarks || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title={
              <Typography.Title level={5} style={{ margin: 0 }}>
                Items
              </Typography.Title>
            }
          >
            <DataTable<SalesInvoiceItem>
              columns={ITEM_COLUMNS}
              dataSource={invoice.items}
              rowKey="id"
              pagination={false}
              size="small"
              totalLabel="items"
              expandable={{
                // Challan-billed lines carry no stock rows of their own — the
                // goods moved when the challan was dispatched.
                rowExpandable: item => item.stocks.length > 0,
                expandedRowRender: item => (
                  <Table<StockLine>
                    columns={STOCK_COLUMNS}
                    dataSource={item.stocks}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ),
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

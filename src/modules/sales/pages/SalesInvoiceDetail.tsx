import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Skeleton, Space, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePagePermission } from '@/hooks/usePagePermission'
import { getErrorMessage } from '@/api/client'
import { downloadSalesInvoicePdf } from '@/api/salesInvoices'
import { SUMMARY_PROPS } from '@/components/erp/detailSummary'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesInvoiceItem, SalesInvoiceItemStock } from '@/types/sales'
import { INVOICE_STATUS_BADGE, INVOICE_STATUS_LABELS } from '../constants'
import {
  useCancelSalesInvoice,
  usePostSalesInvoice,
  useSalesInvoice,
} from '../hooks/useSalesInvoices'
import { formatDateTime } from '@/utils/date'

const money = (value: number) => `₹${value.toFixed(2)}`

const STOCK_COLUMNS: TableColumnsType<SalesInvoiceItemStock> = [
  {
    title: 'Location',
    dataIndex: 'locationName',
    key: 'locationName',
    render: (v, r) => v ?? r.locationId,
  },
  { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo', render: v => v ?? '—' },
  { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo', render: v => v ?? '—' },
  { title: 'Serial No', dataIndex: 'serialNo', key: 'serialNo', render: v => v ?? '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
]

const ITEM_COLUMNS: TableColumnsType<SalesInvoiceItem> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, r) => (r.itemCode ? `${r.itemCode} — ${r.itemName}` : (r.itemName ?? r.itemId)),
  },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 90, render: v => v ?? '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 100, align: 'right' },
  { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 100, align: 'right', render: money },
  {
    title: 'Challan Rate',
    dataIndex: 'challanRate',
    key: 'challanRate',
    width: 120,
    align: 'right',
    render: v => (v != null ? money(v) : '—'),
  },
  { title: 'Disc %', dataIndex: 'discountPercent', key: 'discountPercent', width: 90 },
  { title: 'Tax %', dataIndex: 'taxPercent', key: 'taxPercent', width: 90 },
  {
    title: 'Tax Amt',
    dataIndex: 'taxAmount',
    key: 'taxAmount',
    width: 110,
    align: 'right',
    render: money,
  },
  {
    title: 'Line Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    width: 120,
    align: 'right',
    render: money,
  },
  { title: 'Remark', dataIndex: 'itemRemark', key: 'itemRemark', render: v => v || '—' },
]

export const SalesInvoiceDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { canModify, canApprove } = usePagePermission()
  const { data: invoice, isLoading } = useSalesInvoice(id)
  const { mutateAsync: runPost, isPending: posting } = usePostSalesInvoice()
  const { mutateAsync: runCancel, isPending: cancelling } = useCancelSalesInvoice()
  const [downloading, setDownloading] = useState(false)

  if (!invoice) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/invoices')}>
          Back to Sales Invoices
        </Button>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 24 }} />
        ) : (
          <p style={{ marginTop: 24 }}>Sales invoice not found.</p>
        )}
      </div>
    )
  }

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action()
      message.success(successMessage)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handlePost = () =>
    modal.confirm({
      title: `Post ${invoice.invoiceNumber}?`,
      content: 'A posted invoice can no longer be edited or deleted — only cancelled.',
      okText: 'Post Invoice',
      onOk: () => run(() => runPost(invoice.id), 'Invoice posted'),
    })

  const handleCancel = () =>
    modal.confirm({
      title: `Cancel ${invoice.invoiceNumber}?`,
      content:
        'This reverses the stock issued by this invoice and the billed quantity on its delivery challan lines.',
      okText: 'Cancel Invoice',
      okButtonProps: { danger: true },
      onOk: () => run(() => runCancel(invoice.id), 'Invoice cancelled'),
    })

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadSalesInvoicePdf(Number(invoice.id), invoice.invoiceNumber)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setDownloading(false)
    }
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
            <Button icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
              Download PDF
            </Button>
            {/* Posting an invoice is ERP-BE's `post` action, which its own
                action_overrides map onto `approve`. */}
            {canApprove && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                disabled={invoice.status !== 'DRAFT'}
                loading={posting}
                onClick={handlePost}
              >
                Post Invoice
              </Button>
            )}
            {canModify && (
              <Button
                danger
                icon={<StopOutlined />}
                disabled={invoice.status !== 'POSTED'}
                loading={cancelling}
                onClick={handleCancel}
              >
                Cancel Invoice
              </Button>
            )}
          </Space>
        }
      />

      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card>
            <Descriptions {...SUMMARY_PROPS}>
              <Descriptions.Item label="Status">
                <StatusBadge
                  status={INVOICE_STATUS_BADGE[invoice.status]}
                  label={INVOICE_STATUS_LABELS[invoice.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Date">
                {formatDateTime(invoice.invoiceDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {invoice.partyName ?? invoice.partyId}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN">{invoice.gstin || '—'}</Descriptions.Item>
              <Descriptions.Item label="GST Type">{invoice.gstType || '—'}</Descriptions.Item>
              <Descriptions.Item label="State Code">
                {invoice.partyStateCode || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Taxable Amount">
                {money(invoice.taxableAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Tax Amount">{money(invoice.taxAmount)}</Descriptions.Item>
              <Descriptions.Item label="Net Amount">{money(invoice.netAmount)}</Descriptions.Item>
              <Descriptions.Item label="Remarks" span="filled">
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
                expandedRowRender: item => (
                  <DataTable<SalesInvoiceItemStock>
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

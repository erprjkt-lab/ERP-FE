import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Input, Row, Space, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { downloadSalesQuotationPdf } from '@/api/salesQuotations'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesQuotationItem } from '@/types/sales'
import { DetailFallback } from '../components/DetailFallback'
import { QUOTATION_STATUS_BADGE, QUOTATION_STATUS_LABELS } from '../constants'
import { useCreateSalesOrderFromQuotation } from '../hooks/useSalesOrders'
import {
  useDeleteSalesQuotation,
  useSalesQuotation,
  useSalesQuotationAction,
} from '../hooks/useSalesQuotations'

const ITEM_COLUMNS: TableColumnsType<SalesQuotationItem> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, r) => (r.itemCode ? `${r.itemCode} — ${r.itemName}` : (r.itemName ?? r.itemId)),
  },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80 },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
  { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 90 },
  { title: 'Tool', dataIndex: 'toolCost', key: 'toolCost', width: 80 },
  { title: 'Gauge', dataIndex: 'gaugeCost', key: 'gaugeCost', width: 80 },
  { title: 'Sample', dataIndex: 'sampleCost', key: 'sampleCost', width: 80 },
  { title: 'Disc %', dataIndex: 'discountPercent', key: 'discountPercent', width: 80 },
  { title: 'Tax %', dataIndex: 'taxPercent', key: 'taxPercent', width: 80 },
  {
    title: 'Line Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    width: 110,
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Delivery',
    dataIndex: 'deliveryTime',
    key: 'deliveryTime',
    width: 110,
    render: v => v || '—',
  },
]

export const SalesQuotationDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: quotation, isLoading, error } = useSalesQuotation(id)
  const { mutateAsync: runAction, isPending: actionPending } = useSalesQuotationAction()
  const { mutateAsync: createOrder, isPending: creatingOrder } = useCreateSalesOrderFromQuotation()
  const { mutateAsync: removeQuotation, isPending: deleting } = useDeleteSalesQuotation()
  const rejectReason = useRef('')
  const [downloading, setDownloading] = useState(false)

  if (!quotation) {
    return (
      <DetailFallback
        isLoading={isLoading}
        error={error}
        backTo="/sales/quotations"
        backLabel="Back to Quotations"
        notFoundLabel="Quotation not found."
      />
    )
  }

  const isDraft = quotation.status === 'DRAFT'
  const isSent = quotation.status === 'SENT'
  const isAccepted = quotation.status === 'ACCEPTED'
  // Backend blocks edits once a quotation is accepted, rejected or revised.
  const isLocked = ['ACCEPTED', 'REJECTED', 'REVISED'].includes(quotation.status)

  const handle = async (action: 'send' | 'accept' | 'revise', successMessage: string) => {
    try {
      const result = await runAction({ id: quotation.id, action })
      message.success(successMessage)
      // A revision is a brand-new draft row — follow the user to it.
      if (action === 'revise' && result) navigate(`/sales/quotations/${result.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleReject = () => {
    rejectReason.current = ''
    modal.confirm({
      title: 'Reject this quotation?',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Reason (optional)"
          onChange={e => {
            rejectReason.current = e.target.value
          }}
        />
      ),
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await runAction({
            id: quotation.id,
            action: 'reject',
            reason: rejectReason.current || null,
          })
          message.success('Quotation rejected')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const handleCreateOrder = async () => {
    try {
      const order = await createOrder({ quotationId: quotation.id, payload: {} })
      message.success(`Sales order ${order.orderNumber} created`)
      navigate(`/sales/orders/${order.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadSalesQuotationPdf(Number(quotation.id), quotation.quotationNumber)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not download the PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = () => {
    modal.confirm({
      title: `Delete ${quotation.quotationNumber}?`,
      content: 'This permanently removes the quotation and its items.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeQuotation(quotation.id)
          message.success('Quotation deleted')
          navigate('/sales/quotations')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  return (
    <div>
      <PageHeader
        title={quotation.quotationNumber}
        subtitle={QUOTATION_STATUS_LABELS[quotation.status]}
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Quotation', href: '/sales/quotations' },
          { label: quotation.quotationNumber },
        ]}
        actions={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/quotations')}>
              Back
            </Button>
            <Button icon={<FilePdfOutlined />} loading={downloading} onClick={handleDownload}>
              Download PDF
            </Button>
            <Button
              icon={<EditOutlined />}
              disabled={isLocked}
              onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
            >
              Edit
            </Button>
            <Button
              icon={<SendOutlined />}
              type={isDraft ? 'primary' : 'default'}
              disabled={!isDraft}
              loading={actionPending}
              onClick={() => handle('send', 'Quotation sent')}
            >
              Send
            </Button>
            <Button
              icon={<CheckOutlined />}
              type={isSent ? 'primary' : 'default'}
              disabled={!isSent}
              loading={actionPending}
              onClick={() => handle('accept', 'Quotation accepted')}
            >
              Accept
            </Button>
            <Button icon={<CloseOutlined />} danger disabled={!isSent} onClick={handleReject}>
              Reject
            </Button>
            <Button
              disabled={isAccepted || quotation.status === 'REVISED'}
              loading={actionPending}
              onClick={() => handle('revise', 'Revision created')}
            >
              Revise
            </Button>
            {/* Backend only permits deletion while still a draft. */}
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!isDraft}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
            {/* The backend allows only one order per quotation and rejects a
                second attempt with a clear message; there's no endpoint to look
                up an existing order by quotation id, so we surface that error
                rather than guessing from a paginated list. */}
            <Button
              icon={<FileDoneOutlined />}
              type={isAccepted ? 'primary' : 'default'}
              disabled={!isAccepted}
              loading={creatingOrder}
              onClick={handleCreateOrder}
            >
              Create Sales Order
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
                  status={QUOTATION_STATUS_BADGE[quotation.status]}
                  label={QUOTATION_STATUS_LABELS[quotation.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Quotation Date">
                {quotation.quotationDate}
              </Descriptions.Item>
              <Descriptions.Item label="Valid Until">
                {quotation.validUntil || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {quotation.partyName ?? quotation.partyId}
              </Descriptions.Item>
              <Descriptions.Item label="Revision">
                {quotation.revisionNo > 0 ? <Tag color="blue">R{quotation.revisionNo}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                {quotation.salesEnquiryId ? (
                  <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={() => navigate(`/sales/enquiries/${quotation.salesEnquiryId}`)}
                  >
                    View Enquiry
                  </Button>
                ) : (
                  'Direct'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN">{quotation.gstin || '—'}</Descriptions.Item>
              <Descriptions.Item label="State Code">
                {quotation.partyStateCode || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Net Amount">
                <Typography.Text strong>{quotation.netAmount.toFixed(2)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Remarks" span={3}>
                {quotation.remarks || '—'}
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
            <DataTable<SalesQuotationItem>
              columns={ITEM_COLUMNS}
              dataSource={quotation.items}
              rowKey="id"
              pagination={false}
              size="small"
              totalLabel="items"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

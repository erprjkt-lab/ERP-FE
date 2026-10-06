import { useQueryClient } from '@tanstack/react-query'
import { CheckCircleOutlined } from '@ant-design/icons'
import { App, Button, Card, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { Drawer } from '@/components/ui/Drawer'
import { usePurchaseEnquiry, useQuotationComparison } from '../hooks/usePurchaseEnquiries'
import type {
  QuotationComparisonQuote,
  QuotationComparisonRow,
} from '../hooks/usePurchaseEnquiries'
import { useSelectSupplierForEnquiry } from '../hooks/usePurchaseOrders'
import { getErrorMessage } from '@/api/client'

export interface QuotationComparisonDrawerProps {
  open: boolean
  onClose: () => void
  enquiryId?: string
}

export const QuotationComparisonDrawer: FC<QuotationComparisonDrawerProps> = ({
  open,
  onClose,
  enquiryId,
}) => {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const { data: enquiry } = usePurchaseEnquiry(enquiryId)
  const { data: rows } = useQuotationComparison(enquiryId)
  const { mutateAsync: selectSupplier, isPending: selecting } = useSelectSupplierForEnquiry()

  // Permanently-mounted sibling of the page (visibility toggled by `open`),
  // so force a fresh fetch on every open rather than trusting the cache —
  // same reasoning as SupplierQuotationFormDrawer.
  useEffect(() => {
    if (!open || !enquiryId) return
    queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', enquiryId] })
    queryClient.invalidateQueries({
      queryKey: ['purchase-enquiries', enquiryId, 'quotation-comparison'],
    })
  }, [open, enquiryId, queryClient])

  // A quotation can in principle be re-recorded for the same supplier, so key
  // everything by the specific quotation id (not supplier id) — the union of
  // quotations seen across all item rows becomes the comparison columns.
  const quotationsById = new Map<string, QuotationComparisonQuote>()
  rows.forEach(row => row.quotes.forEach(q => quotationsById.set(q.supplierQuotationId, q)))
  const distinctQuotations = Array.from(quotationsById.values())

  const totalForQuotation = (quotationId: string) => {
    const lineSum = rows.reduce((sum, row) => {
      const line = row.quotes.find(q => q.supplierQuotationId === quotationId)
      return sum + (line?.lineTotal ?? 0)
    }, 0)
    const meta = quotationsById.get(quotationId)
    return lineSum + (meta?.freightAmount ?? 0) + (meta?.otherCharges ?? 0)
  }

  const isSupplierSelected = (supplierId: string) =>
    enquiry?.suppliers.find(sup => sup.supplierId === supplierId)?.supplierStatus === 'SELECTED'

  const handleSelect = async (quote: QuotationComparisonQuote) => {
    if (!enquiry) return
    try {
      await selectSupplier({
        enquiryId: enquiry.id,
        supplierId: quote.supplierId,
        quotationId: quote.supplierQuotationId,
      })
      message.success('Supplier selected for this enquiry')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const itemColumns: TableColumnsType<QuotationComparisonRow> = [
    {
      title: 'Item',
      key: 'item',
      fixed: 'left',
      width: 200,
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.itemName}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>Required: {row.requiredQty}</div>
          {row.sourcePrNumber && (
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>from {row.sourcePrNumber}</div>
          )}
        </div>
      ),
    },
    ...distinctQuotations.map(quote => ({
      title: (
        <div>
          <div style={{ fontWeight: 600 }}>{quote.supplierName}</div>
          {isSupplierSelected(quote.supplierId) && <Tag color="green">Selected</Tag>}
        </div>
      ),
      key: quote.supplierQuotationId,
      width: 180,
      render: (_: unknown, row: QuotationComparisonRow) => {
        const line = row.quotes.find(q => q.supplierQuotationId === quote.supplierQuotationId)
        if (!line) return '—'
        return (
          <div>
            <div>
              {line.quotedQty} × {line.rate}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              Disc {line.discountPercent}% · Tax {line.taxPercent}%
            </div>
            <div style={{ fontWeight: 500 }}>{line.lineTotal.toFixed(2)}</div>
          </div>
        )
      },
    })),
  ]

  const summaryColumns: TableColumnsType<QuotationComparisonQuote> = [
    { title: 'Supplier', key: 'supplier', render: (_, q) => q.supplierName },
    { title: 'Payment Terms', key: 'paymentTerms', render: (_, q) => q.paymentTerms ?? '—' },
    { title: 'Delivery Terms', key: 'deliveryTerms', render: (_, q) => q.deliveryTerms ?? '—' },
    { title: 'Valid Until', key: 'validUntil', render: (_, q) => q.validUntil ?? '—' },
    { title: 'Freight', key: 'freight', render: (_, q) => q.freightAmount },
    { title: 'Other Charges', key: 'other', render: (_, q) => q.otherCharges },
    {
      title: 'Total Amount',
      key: 'total',
      render: (_, q) => (
        <Typography.Text strong>
          {totalForQuotation(q.supplierQuotationId).toFixed(2)}
        </Typography.Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, q) =>
        isSupplierSelected(q.supplierId) ? (
          <Tag icon={<CheckCircleOutlined />} color="green">
            Selected
          </Tag>
        ) : (
          <Button
            size="small"
            type="primary"
            loading={selecting}
            disabled={enquiry?.status === 'PO_CREATED'}
            onClick={() => handleSelect(q)}
          >
            Select
          </Button>
        ),
    },
  ]

  return (
    <Drawer
      title={`Compare Quotations${enquiry ? ` — ${enquiry.enquiryNumber}` : ''}`}
      open={open}
      onClose={onClose}
      width={960}
    >
      {!enquiry ? (
        <Typography.Text type="secondary">Loading…</Typography.Text>
      ) : distinctQuotations.length === 0 ? (
        <Card>
          <Typography.Text>No supplier quotations have been recorded yet.</Typography.Text>
        </Card>
      ) : (
        <>
          <Card
            title={
              <Typography.Title level={5} style={{ margin: 0 }}>
                Item-wise Comparison
              </Typography.Title>
            }
            style={{ marginBottom: 16 }}
          >
            <DataTable
              columns={itemColumns}
              dataSource={rows}
              rowKey="purchaseEnquiryItemId"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </Card>
          <Card
            title={
              <Typography.Title level={5} style={{ margin: 0 }}>
                Supplier Summary
              </Typography.Title>
            }
          >
            <DataTable
              columns={summaryColumns}
              dataSource={distinctQuotations}
              rowKey="supplierQuotationId"
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}
    </Drawer>
  )
}

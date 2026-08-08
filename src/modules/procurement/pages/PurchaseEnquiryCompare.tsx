import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { App, Button, Card, Table, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import type { PurchaseEnquiryItem, SupplierQuotation } from '@/types/procurement'
import { usePurchaseEnquiry } from '../hooks/usePurchaseEnquiries'
import { useSelectSupplierForEnquiry } from '../hooks/usePurchaseOrders'
import { useQuotationsForEnquiry } from '../hooks/useSupplierQuotations'

export const PurchaseEnquiryCompare: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { data: enquiry, isLoading } = usePurchaseEnquiry(id)
  const { data: quotations } = useQuotationsForEnquiry(id)
  const { mutateAsync: selectSupplier, isPending: selecting } = useSelectSupplierForEnquiry()

  if (!enquiry) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/enquiries')}>
          Back to Enquiries
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Purchase enquiry not found.'}</p>
      </div>
    )
  }

  const respondedSuppliers = enquiry.suppliers.filter(sup =>
    quotations.some(q => q.purchaseEnquirySupplierId === sup.id),
  )

  const handleSelect = async (peSupplierId: string) => {
    try {
      await selectSupplier({ enquiryId: enquiry.id, peSupplierId })
      message.success('Supplier selected for this enquiry')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const itemColumns: TableColumnsType<PurchaseEnquiryItem> = [
    {
      title: 'Item',
      key: 'item',
      fixed: 'left',
      width: 200,
      render: (_, item) => (
        <div>
          <div style={{ fontWeight: 500 }}>{item.itemName}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
            Required: {item.requiredQty} {item.uomName}
          </div>
        </div>
      ),
    },
    ...respondedSuppliers.map(sup => {
      const quotation = quotations.find(q => q.purchaseEnquirySupplierId === sup.id)
      return {
        title: (
          <div>
            <div style={{ fontWeight: 600 }}>{sup.supplierName}</div>
            {sup.supplierStatus === 'SELECTED' && <Tag color="green">Selected</Tag>}
          </div>
        ),
        key: sup.id,
        width: 180,
        render: (_: unknown, item: PurchaseEnquiryItem) => {
          const line = quotation?.items.find(i => i.purchaseEnquiryItemId === item.id)
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
      }
    }),
  ]

  const summaryColumns: TableColumnsType<{
    supplier: (typeof respondedSuppliers)[number]
    quotation: SupplierQuotation
  }> = [
    { title: 'Supplier', key: 'supplier', render: (_, r) => r.supplier.supplierName },
    {
      title: 'Payment Terms',
      key: 'paymentTerms',
      render: (_, r) => r.quotation.paymentTerms ?? '—',
    },
    {
      title: 'Delivery Terms',
      key: 'deliveryTerms',
      render: (_, r) => r.quotation.deliveryTerms ?? '—',
    },
    { title: 'Valid Until', key: 'validUntil', render: (_, r) => r.quotation.validUntil ?? '—' },
    { title: 'Freight', key: 'freight', render: (_, r) => r.quotation.freightAmount },
    { title: 'Other Charges', key: 'other', render: (_, r) => r.quotation.otherCharges },
    {
      title: 'Total Amount',
      key: 'total',
      render: (_, r) => (
        <Typography.Text strong>
          {r.quotation.currency} {r.quotation.totalAmount.toFixed(2)}
        </Typography.Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) =>
        r.supplier.supplierStatus === 'SELECTED' ? (
          <Tag icon={<CheckCircleOutlined />} color="green">
            Selected
          </Tag>
        ) : (
          <Button
            size="small"
            type="primary"
            loading={selecting}
            disabled={enquiry.status === 'PO_CREATED'}
            onClick={() => handleSelect(r.supplier.id)}
          >
            Select
          </Button>
        ),
    },
  ]

  const summaryData = respondedSuppliers
    .map(supplier => {
      const quotation = quotations.find(q => q.purchaseEnquirySupplierId === supplier.id)
      return quotation ? { supplier, quotation } : undefined
    })
    .filter(
      (
        row,
      ): row is { supplier: (typeof respondedSuppliers)[number]; quotation: SupplierQuotation } =>
        !!row,
    )

  return (
    <div>
      <PageHeader
        title={`Compare Quotations — ${enquiry.enquiryNumber}`}
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'Enquiries', href: '/purchase/enquiries' },
          { label: enquiry.enquiryNumber, href: `/purchase/enquiries/${enquiry.id}` },
          { label: 'Compare' },
        ]}
        actions={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/purchase/enquiries/${enquiry.id}`)}
          >
            Back to Enquiry
          </Button>
        }
      />

      {respondedSuppliers.length === 0 ? (
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
            <Table
              columns={itemColumns}
              dataSource={enquiry.items}
              rowKey="id"
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
            <Table
              columns={summaryColumns}
              dataSource={summaryData}
              rowKey={r => r.supplier.id}
              pagination={false}
              size="small"
            />
          </Card>
        </>
      )}
    </div>
  )
}

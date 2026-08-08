import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { CURRENCY_OPTIONS } from '../constants'
import { usePurchaseEnquiry } from '../hooks/usePurchaseEnquiries'
import {
  useRecordSupplierQuotation,
  useSupplierQuotationByPeSupplier,
} from '../hooks/useSupplierQuotations'
import type { SupplierQuotationItemInput } from '../store/procurementStore'

interface ItemRowValues {
  quotedQty: number
  rate: number
  discountPercent: number
  taxPercent: number
  deliveryDate?: dayjs.Dayjs
  remarks?: string
}

export const SupplierQuotationForm: FC = () => {
  const { id: enquiryId, peSupplierId } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: enquiry } = usePurchaseEnquiry(enquiryId)
  const { data: existingQuotation } = useSupplierQuotationByPeSupplier(peSupplierId)
  const { mutateAsync: recordQuotation, isPending: saving } = useRecordSupplierQuotation()

  const peSupplier = enquiry?.suppliers.find(sup => sup.id === peSupplierId)

  useEffect(() => {
    if (existingQuotation) {
      form.setFieldsValue({
        quotationNumber: existingQuotation.quotationNumber,
        quotationDate: dayjs(existingQuotation.quotationDate),
        validUntil: existingQuotation.validUntil ? dayjs(existingQuotation.validUntil) : undefined,
        currency: existingQuotation.currency,
        paymentTerms: existingQuotation.paymentTerms,
        deliveryTerms: existingQuotation.deliveryTerms,
        freightAmount: existingQuotation.freightAmount,
        otherCharges: existingQuotation.otherCharges,
        remarks: existingQuotation.remarks,
        items: enquiry?.items.map(peItem => {
          const existingItem = existingQuotation.items.find(
            i => i.purchaseEnquiryItemId === peItem.id,
          )
          return {
            quotedQty: existingItem?.quotedQty ?? peItem.requiredQty,
            rate: existingItem?.rate ?? 0,
            discountPercent: existingItem?.discountPercent ?? 0,
            taxPercent: existingItem?.taxPercent ?? 0,
            deliveryDate: existingItem?.deliveryDate ? dayjs(existingItem.deliveryDate) : undefined,
            remarks: existingItem?.remarks,
          }
        }),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingQuotation?.id, enquiry?.id, form])

  if (!enquiry || !peSupplier) {
    return (
      <div>
        <Button onClick={() => navigate(`/purchase/enquiries/${enquiryId}`)}>Back</Button>
        <p style={{ marginTop: 24 }}>Loading…</p>
      </div>
    )
  }

  const handleFinish = async (values: {
    quotationNumber: string
    quotationDate: dayjs.Dayjs
    validUntil?: dayjs.Dayjs
    currency: string
    paymentTerms?: string
    deliveryTerms?: string
    freightAmount: number
    otherCharges: number
    remarks?: string
    items: ItemRowValues[]
  }) => {
    const items: SupplierQuotationItemInput[] = enquiry.items.map((peItem, index) => {
      const row = values.items[index]
      return {
        purchaseEnquiryItemId: peItem.id,
        itemId: peItem.itemId,
        itemName: peItem.itemName,
        quotedQty: row.quotedQty,
        uomId: peItem.uomId,
        uomName: peItem.uomName,
        rate: row.rate,
        discountPercent: row.discountPercent,
        taxPercent: row.taxPercent,
        deliveryDate: row.deliveryDate ? row.deliveryDate.format('YYYY-MM-DD') : null,
        remarks: row.remarks,
      }
    })

    try {
      await recordQuotation({
        purchaseEnquiryId: enquiry.id,
        purchaseEnquirySupplierId: peSupplier.id,
        quotationNumber: values.quotationNumber,
        quotationDate: values.quotationDate.format('YYYY-MM-DD'),
        validUntil: values.validUntil ? values.validUntil.format('YYYY-MM-DD') : null,
        currency: values.currency,
        paymentTerms: values.paymentTerms,
        deliveryTerms: values.deliveryTerms,
        freightAmount: values.freightAmount ?? 0,
        otherCharges: values.otherCharges ?? 0,
        remarks: values.remarks,
        items,
      })
      message.success('Supplier quotation recorded')
      navigate(`/purchase/enquiries/${enquiry.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={`Quotation — ${peSupplier.supplierName ?? peSupplier.supplierId}`}
        subtitle={enquiry.enquiryNumber}
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'Enquiries', href: '/purchase/enquiries' },
          { label: enquiry.enquiryNumber, href: `/purchase/enquiries/${enquiry.id}` },
          { label: peSupplier.supplierName ?? 'Quotation' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate(`/purchase/enquiries/${enquiry.id}`)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Save Quotation
            </Button>
          </Space>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            quotationDate: dayjs(),
            currency: 'INR',
            freightAmount: 0,
            otherCharges: 0,
            items: enquiry.items.map(peItem => ({
              quotedQty: peItem.requiredQty,
              rate: 0,
              discountPercent: 0,
              taxPercent: 0,
            })),
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
            <Form.Item
              label="Quotation Number"
              name="quotationNumber"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Quotation Date"
              name="quotationDate"
              rules={[{ required: true, message: 'Required' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Valid Until" name="validUntil">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
            <Form.Item label="Currency" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
            <Form.Item label="Payment Terms" name="paymentTerms">
              <Input />
            </Form.Item>
            <Form.Item label="Delivery Terms" name="deliveryTerms">
              <Input />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Form.Item label="Freight Amount" name="freightAmount">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Other Charges" name="otherCharges">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Typography.Title level={5}>Items</Typography.Title>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 90px 90px 90px 90px 130px 1fr',
              gap: '0 8px',
              fontSize: 12,
              color: 'rgba(0,0,0,0.45)',
              marginBottom: 4,
            }}
          >
            <div>Item</div>
            <div>Qty</div>
            <div>Rate</div>
            <div>Disc %</div>
            <div>Tax %</div>
            <div>Delivery Date</div>
            <div>Remarks</div>
          </div>
          {enquiry.items.map((peItem, index) => (
            <div
              key={peItem.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 90px 90px 90px 90px 130px 1fr',
                gap: '0 8px',
                alignItems: 'start',
              }}
            >
              <div style={{ paddingTop: 8 }}>
                {peItem.itemName}{' '}
                <span style={{ color: 'rgba(0,0,0,0.45)' }}>({peItem.uomName})</span>
              </div>
              <Form.Item name={['items', index, 'quotedQty']} rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['items', index, 'rate']} rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['items', index, 'discountPercent']}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['items', index, 'taxPercent']}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['items', index, 'deliveryDate']}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['items', index, 'remarks']}>
                <Input />
              </Form.Item>
            </div>
          ))}
        </Form>
      </Card>
    </div>
  )
}

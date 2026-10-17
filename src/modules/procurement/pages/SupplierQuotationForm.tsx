import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
} from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePagePermission } from '@/hooks/usePagePermission'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePurchaseEnquiry } from '../hooks/usePurchaseEnquiries'
import {
  matchQuotationLines,
  useRecordSupplierQuotation,
  useSupplierQuotationByPeSupplier,
  useUpdateSupplierQuotation,
} from '../hooks/useSupplierQuotations'
import type { SupplierQuotationItemInput } from '../hooks/useSupplierQuotations'
import { getErrorMessage } from '@/api/client'

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
  // Recording a new quotation is `write purchase-enquiries` on ERP-BE;
  // editing one already on file is `modify` (SupplierQuotationController).
  const { canWrite, canModify } = usePagePermission()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: enquiry } = usePurchaseEnquiry(enquiryId)
  const { data: existingQuotation, isLoading: quotationLoading } = useSupplierQuotationByPeSupplier(
    enquiryId,
    peSupplierId,
  )
  const { mutateAsync: recordQuotation, isPending: recording } = useRecordSupplierQuotation()
  const { mutateAsync: updateQuotation, isPending: updating } = useUpdateSupplierQuotation()
  const saving = recording || updating

  const peSupplier = enquiry?.suppliers.find(sup => sup.id === peSupplierId)
  const isEdit = Boolean(existingQuotation)
  const canSave = isEdit ? canModify : canWrite

  useEffect(() => {
    // Both have to be in before prefilling: the rows are driven by the enquiry's
    // items, and the values by the quotation's lines.
    if (existingQuotation && enquiry) {
      const matched = matchQuotationLines(enquiry.items, existingQuotation.items)

      form.setFieldsValue({
        quotationNumber: existingQuotation.quotationNumber,
        quotationDate: dayjs(existingQuotation.quotationDate),
        validUntil: existingQuotation.validUntil ? dayjs(existingQuotation.validUntil) : undefined,
        paymentTerms: existingQuotation.paymentTerms,
        deliveryTerms: existingQuotation.deliveryTerms,
        freightAmount: existingQuotation.freightAmount,
        otherCharges: existingQuotation.otherCharges,
        remarks: existingQuotation.remarks,
        items: enquiry.items.map((peItem, index) => {
          const existingItem = matched[index]
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

  // Wait for the quotation lookup too, not just the enquiry: until it settles
  // `existingQuotation` is undefined, and submitting then would POST a second
  // quotation for a supplier that already has one instead of updating it.
  if (!enquiry || !peSupplier || quotationLoading) {
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

    const input = {
      purchaseEnquiryId: enquiry.id,
      purchaseEnquirySupplierId: peSupplier.id,
      quotationNumber: values.quotationNumber,
      quotationDate: values.quotationDate.format('YYYY-MM-DD'),
      validUntil: values.validUntil ? values.validUntil.format('YYYY-MM-DD') : null,
      paymentTerms: values.paymentTerms,
      deliveryTerms: values.deliveryTerms,
      freightAmount: values.freightAmount ?? 0,
      otherCharges: values.otherCharges ?? 0,
      remarks: values.remarks,
      items,
    }

    try {
      // A supplier may hold only one quotation per enquiry (ERP-BE enforces it),
      // so an edit has to PUT the existing one — POSTing again would either
      // duplicate the quotation or be rejected outright.
      if (existingQuotation) {
        await updateQuotation({ quotationId: existingQuotation.id, input })
      } else {
        await recordQuotation(input)
      }
      message.success(`Supplier quotation ${existingQuotation ? 'updated' : 'recorded'}`)
      navigate(`/purchase/enquiries/${enquiry.id}`)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const supplierLabel = peSupplier.supplierName ?? peSupplier.supplierId

  return (
    <div>
      <PageHeader
        title={`${existingQuotation ? 'Edit' : 'Record'} Quotation — ${supplierLabel}`}
        subtitle={enquiry.enquiryNumber}
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'Enquiries', href: '/purchase/enquiries' },
          { label: enquiry.enquiryNumber, href: `/purchase/enquiries/${enquiry.id}` },
          { label: supplierLabel },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate(`/purchase/enquiries/${enquiry.id}`)}>Cancel</Button>
            {canSave && (
              <Button type="primary" loading={saving} onClick={() => form.submit()}>
                {existingQuotation ? 'Update Quotation' : 'Record Quotation'}
              </Button>
            )}
          </Space>
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          existingQuotation ? 'Editing a recorded quotation' : 'Recording a supplier quotation'
        }
        description={
          existingQuotation
            ? `Update the quotation on file from ${supplierLabel} for ${enquiry.enquiryNumber}.`
            : `${supplierLabel} responded to this enquiry outside the system — by phone, email, or on paper. Enter what they quoted below (number, rates, terms). Once saved, it shows up on the Compare Quotations screen alongside the other suppliers on ${enquiry.enquiryNumber}.`
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            quotationDate: dayjs(),
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
          <FormSection title="Quotation Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Quotation Number"
                  name="quotationNumber"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Quotation Date"
                  name="quotationDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item label="Valid Until" name="validUntil">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Terms & Charges">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <Form.Item label="Payment Terms" name="paymentTerms">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item label="Delivery Terms" name="deliveryTerms">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item label="Freight Amount" name="freightAmount">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item label="Other Charges" name="otherCharges">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} />
            </Form.Item>
          </FormSection>

          <FormSection title="Items">
            <div
              style={{
                overflowX: 'auto',
                maxWidth: '100%',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 4,
              }}
            >
              <div style={{ minWidth: 750 }}>
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
              </div>
            </div>
          </FormSection>
        </Form>
      </Card>
    </div>
  )
}

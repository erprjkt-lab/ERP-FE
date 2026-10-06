import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
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
  Select,
  Space,
} from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import { useSalesEnquiry } from '../hooks/useSalesEnquiries'
import {
  useCreateSalesQuotation,
  useSalesQuotation,
  useUpdateSalesQuotation,
} from '../hooks/useSalesQuotations'
import type { SalesQuotationItemInput } from '../hooks/useSalesQuotations'
import { getErrorMessage } from '@/api/client'

interface ItemRowValues {
  salesEnquiryItemId?: string | null
  itemId: string
  qty: number
  rate: number
  taxPercent?: number
  itemRemark?: string
}

const ROW_GRID = {
  display: 'grid',
  // minmax(0, …) stops a long item label from widening its own row's columns.
  gridTemplateColumns:
    'minmax(0, 3fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr) 32px',
  gap: '0 12px',
  alignItems: 'start',
}
const HEADER_ROW = { padding: '10px 12px', background: '#fafafa', fontWeight: 500 }
const SUMMARY_LINE = { display: 'flex', justifyContent: 'space-between', padding: '4px 0' }

const money = (n: number) => n.toFixed(2)

// Mirrors SalesQuotationService: amount is before tax, tax is on that amount.
// ponytail: ignores per-line discount (not on this form); saved discounts still apply server-side.
const lineAmount = (row?: Partial<ItemRowValues>) => (row?.qty ?? 0) * (row?.rate ?? 0)

interface QuotationFormValues {
  quotationDate: dayjs.Dayjs
  validUntil?: dayjs.Dayjs
  partyId: string
  gstin?: string
  partyStateCode?: string
  remarks?: string
  items: ItemRowValues[]
}

export const SalesQuotationForm: FC = () => {
  const { id } = useParams()
  const isEdit = !!id
  const [searchParams] = useSearchParams()
  const enquiryId = searchParams.get('enquiryId')
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<QuotationFormValues>()

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { data: sourceEnquiry } = useSalesEnquiry(enquiryId ?? undefined)
  const { data: existing, isLoading } = useSalesQuotation(id)
  const { mutateAsync: create, isPending: creating } = useCreateSalesQuotation()
  const { mutateAsync: update, isPending: updating } = useUpdateSalesQuotation()

  const watchedItems = Form.useWatch('items', form) as Partial<ItemRowValues>[] | undefined
  const totals = (watchedItems ?? []).reduce<{ qty: number; amount: number; tax: number }>(
    (acc, row) => {
      const amount = lineAmount(row)
      return {
        qty: acc.qty + (row?.qty ?? 0),
        amount: acc.amount + amount,
        tax: acc.tax + (amount * (row?.taxPercent ?? 0)) / 100,
      }
    },
    { qty: 0, amount: 0, tax: 0 },
  )

  const customerOptions = customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  // Prefill from the enquiry being quoted: customer plus one row per enquiry
  // line, each carrying its sales_enquiry_item_id so the backend can close the
  // enquiry line out when the quotation is created.
  useEffect(() => {
    if (!sourceEnquiry || isEdit) return
    form.setFieldsValue({
      partyId: String(sourceEnquiry.partyId),
      items: sourceEnquiry.items.map(item => ({
        salesEnquiryItemId: String(item.id),
        itemId: String(item.itemId),
        qty: item.qty,
        rate: 0,
        taxPercent: 0,
        itemRemark: item.itemRemark ?? undefined,
      })),
    })
  }, [sourceEnquiry, isEdit, form])

  useEffect(() => {
    if (!existing) return
    form.setFieldsValue({
      quotationDate: dayjs(existing.quotationDate),
      validUntil: existing.validUntil ? dayjs(existing.validUntil) : undefined,
      partyId: String(existing.partyId),
      gstin: existing.gstin ?? undefined,
      partyStateCode: existing.partyStateCode ?? undefined,
      remarks: existing.remarks ?? undefined,
      items: existing.items.map(item => ({
        salesEnquiryItemId: item.salesEnquiryItemId ? String(item.salesEnquiryItemId) : null,
        itemId: String(item.itemId),
        qty: item.qty,
        rate: item.rate,
        taxPercent: item.taxPercent,
        itemRemark: item.itemRemark ?? undefined,
      })),
    })
  }, [existing, form])

  const handleFinish = async (values: QuotationFormValues) => {
    const itemRows: SalesQuotationItemInput[] = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      // Fields no longer on the form keep whatever was saved before, instead of being nulled.
      const prev = existing?.items.find(i => String(i.itemId) === row.itemId)
      return {
        salesEnquiryItemId: row.salesEnquiryItemId ?? null,
        itemId: row.itemId,
        uomId: item?.uomId ?? null,
        qty: row.qty,
        rate: row.rate,
        toolCost: prev?.toolCost ?? null,
        gaugeCost: prev?.gaugeCost ?? null,
        sampleCost: prev?.sampleCost ?? null,
        discountPercent: prev?.discountPercent ?? null,
        taxPercent: row.taxPercent ?? null,
        deliveryTime: prev?.deliveryTime ?? null,
        drawingRevNo: prev?.drawingRevNo ?? null,
        itemRemark: row.itemRemark ?? null,
      }
    })

    const input = {
      salesEnquiryId: isEdit ? null : enquiryId,
      partyId: values.partyId,
      partyStateCode: values.partyStateCode ?? null,
      gstin: values.gstin ?? null,
      quotationDate: values.quotationDate.format('YYYY-MM-DD'),
      validUntil: values.validUntil ? values.validUntil.format('YYYY-MM-DD') : null,
      remarks: values.remarks ?? null,
      items: itemRows,
    }

    try {
      if (isEdit) await update({ id, input })
      else await create(input)
      message.success(isEdit ? 'Quotation updated' : 'Quotation created')
      navigate('/sales/quotations')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit ${existing?.quotationNumber ?? 'Quotation'}` : 'New Sales Quotation'}
        subtitle="Priced response to a customer enquiry"
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Quotation', href: '/sales/quotations' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/sales/quotations')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Save Changes' : 'Save Quotation'}
            </Button>
          </Space>
        }
      />

      {sourceEnquiry && !isEdit && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Quoting against enquiry ${sourceEnquiry.enquiryNumber}`}
          description="Items were prefilled from the enquiry — set a rate for each line before saving."
        />
      )}

      <Card loading={isEdit && isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ quotationDate: dayjs(), items: [{ taxPercent: 0, rate: 0 }] }}
        >
          <FormSection title="Quotation Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Quotation Date"
                  name="quotationDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Valid Until" name="validUntil">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label="Customer"
                  name="partyId"
                  rules={[{ required: true, message: 'Required' }]}
                  // The update endpoint doesn't accept party_id, so a change
                  // here would be silently dropped — the customer is fixed
                  // once the quotation exists.
                  extra={isEdit ? 'Customer cannot be changed after creation' : undefined}
                >
                  <Select
                    placeholder="Select customer"
                    options={customerOptions}
                    disabled={isEdit || (!!sourceEnquiry && !isEdit)}
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="GSTIN" name="gstin">
                  <Input placeholder="Customer GSTIN" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="State Code" name="partyStateCode">
                  <Input maxLength={2} placeholder="e.g. 24" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} />
            </Form.Item>
          </FormSection>

          <FormSection title="Items">
            <Form.List
              name="items"
              rules={[
                {
                  validator: async (_, v) => {
                    if (!v || v.length === 0) throw new Error('Add at least one item')
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 820 }}>
                    <div style={{ ...ROW_GRID, ...HEADER_ROW }}>
                      <span>Item</span>
                      <span>Qty</span>
                      <span>Rate</span>
                      <span>Tax %</span>
                      <span style={{ textAlign: 'right' }}>Amount</span>
                      <span>Remark</span>
                      <span />
                    </div>
                    {fields.map(field => {
                      const row = watchedItems?.[field.name]
                      return (
                        <div key={field.key} style={{ ...ROW_GRID, padding: '8px 12px 0' }}>
                          <Form.Item name={[field.name, 'salesEnquiryItemId']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'itemId']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <Select
                              placeholder="Select item"
                              options={itemOptions}
                              showSearch
                              filterOption={(input, option) =>
                                String(option?.label ?? '')
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'qty']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <InputNumber min={0.0001} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'rate']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name={[field.name, 'taxPercent']}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                          <div
                            style={{
                              textAlign: 'right',
                              lineHeight: '32px',
                              fontWeight: 500,
                              background: '#fafafa',
                              border: '1px solid #f0f0f0',
                              borderRadius: 6,
                              padding: '0 11px',
                            }}
                          >
                            {money(lineAmount(row))}
                          </div>
                          <Form.Item name={[field.name, 'itemRemark']}>
                            <Input />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        </div>
                      )
                    })}
                    {fields.length > 0 && (
                      <div style={{ ...ROW_GRID, ...HEADER_ROW, fontWeight: 600 }}>
                        <span>Total</span>
                        <span>{totals.qty}</span>
                        <span />
                        <span />
                        <span style={{ textAlign: 'right' }}>{money(totals.amount)}</span>
                        <span />
                        <span />
                      </div>
                    )}
                    <Form.ErrorList errors={errors} />
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add({ taxPercent: 0, rate: 0 })}
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      Add Item
                    </Button>
                  </div>
                </div>
              )}
            </Form.List>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <div style={{ width: 280, fontSize: 14 }}>
                <div style={SUMMARY_LINE}>
                  <span>Subtotal</span>
                  <span>{money(totals.amount)}</span>
                </div>
                <div style={SUMMARY_LINE}>
                  <span>Tax</span>
                  <span>{money(totals.tax)}</span>
                </div>
                <div
                  style={{
                    ...SUMMARY_LINE,
                    borderTop: '1px solid #f0f0f0',
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  <span>Grand Total</span>
                  <span>₹ {money(totals.amount + totals.tax)}</span>
                </div>
              </div>
            </div>
          </FormSection>
        </Form>
      </Card>
    </div>
  )
}

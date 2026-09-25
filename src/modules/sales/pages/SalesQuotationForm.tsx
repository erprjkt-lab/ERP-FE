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
  toolCost?: number
  gaugeCost?: number
  sampleCost?: number
  discountPercent?: number
  taxPercent?: number
  deliveryTime?: string
  drawingRevNo?: string
  itemRemark?: string
}

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
        discountPercent: 0,
        taxPercent: 0,
        drawingRevNo: undefined,
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
        toolCost: item.toolCost,
        gaugeCost: item.gaugeCost,
        sampleCost: item.sampleCost,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        deliveryTime: item.deliveryTime ?? undefined,
        drawingRevNo: item.drawingRevNo ?? undefined,
        itemRemark: item.itemRemark ?? undefined,
      })),
    })
  }, [existing, form])

  const handleFinish = async (values: QuotationFormValues) => {
    const itemRows: SalesQuotationItemInput[] = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      return {
        salesEnquiryItemId: row.salesEnquiryItemId ?? null,
        itemId: row.itemId,
        uomId: item?.uomId ?? null,
        qty: row.qty,
        rate: row.rate,
        toolCost: row.toolCost ?? null,
        gaugeCost: row.gaugeCost ?? null,
        sampleCost: row.sampleCost ?? null,
        discountPercent: row.discountPercent ?? null,
        taxPercent: row.taxPercent ?? null,
        deliveryTime: row.deliveryTime ?? null,
        drawingRevNo: row.drawingRevNo ?? null,
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
      const quotation = isEdit ? await update({ id, input }) : await create(input)
      message.success(isEdit ? 'Quotation updated' : 'Quotation created')
      navigate(`/sales/quotations/${quotation.id}`)
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
          initialValues={{ quotationDate: dayjs(), items: [] }}
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
                <>
                  {fields.map(field => (
                    <Card
                      key={field.key}
                      size="small"
                      style={{ marginBottom: 8 }}
                      styles={{ body: { paddingBottom: 0 } }}
                    >
                      <Form.Item name={[field.name, 'salesEnquiryItemId']} hidden>
                        <Input />
                      </Form.Item>
                      <Row gutter={12}>
                        <Col xs={24} md={7}>
                          <Form.Item
                            label="Item"
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
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item
                            label="Qty"
                            name={[field.name, 'qty']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <InputNumber min={0.0001} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item
                            label="Rate"
                            name={[field.name, 'rate']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item label="Discount %" name={[field.name, 'discountPercent']}>
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item label="Tax %" name={[field.name, 'taxPercent']}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item label="Delivery Time" name={[field.name, 'deliveryTime']}>
                            <Input placeholder="e.g. 4 weeks" />
                          </Form.Item>
                        </Col>
                        <Col
                          xs={12}
                          md={2}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item label="Tool Cost" name={[field.name, 'toolCost']}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item label="Gauge Cost" name={[field.name, 'gaugeCost']}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item label="Sample Cost" name={[field.name, 'sampleCost']}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item label="Drawing Rev" name={[field.name, 'drawingRevNo']}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label="Item Remark" name={[field.name, 'itemRemark']}>
                            <Input />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ discountPercent: 0, taxPercent: 0, rate: 0 })}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    Add Item
                  </Button>
                </>
              )}
            </Form.List>
          </FormSection>
        </Form>
      </Card>
    </div>
  )
}

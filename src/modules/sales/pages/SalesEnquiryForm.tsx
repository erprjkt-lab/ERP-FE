import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
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
import { useNavigate, useParams } from 'react-router-dom'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import {
  useCreateSalesEnquiry,
  useSalesEnquiry,
  useUpdateSalesEnquiry,
} from '../hooks/useSalesEnquiries'
import type { SalesEnquiryItemInput } from '../hooks/useSalesEnquiries'
import { getErrorMessage } from '@/api/client'

interface ItemRowValues {
  itemId: string
  qty: number
  itemRemark?: string
}

interface EnquiryFormValues {
  enquiryDate: dayjs.Dayjs
  partyId: string
  refBy?: string
  remarks?: string
  items: ItemRowValues[]
}

export const SalesEnquiryForm: FC = () => {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<EnquiryFormValues>()

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { data: existing, isLoading } = useSalesEnquiry(id)
  const { mutateAsync: create, isPending: creating } = useCreateSalesEnquiry()
  const { mutateAsync: update, isPending: updating } = useUpdateSalesEnquiry()

  const customerOptions = customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  useEffect(() => {
    if (!existing) return
    form.setFieldsValue({
      enquiryDate: dayjs(existing.enquiryDate),
      partyId: String(existing.partyId),
      refBy: existing.refBy ?? undefined,
      remarks: existing.remarks ?? undefined,
      items: existing.items.map(item => ({
        itemId: String(item.itemId),
        qty: item.qty,
        itemRemark: item.itemRemark ?? undefined,
      })),
    })
  }, [existing, form])

  const handleFinish = async (values: EnquiryFormValues) => {
    const itemRows: SalesEnquiryItemInput[] = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      // Fields no longer on the form keep whatever was saved before, instead of being nulled.
      const prev = existing?.items.find(i => String(i.itemId) === row.itemId)
      return {
        itemId: row.itemId,
        uomId: item?.uomId ?? null,
        qty: row.qty,
        annualVolume: prev?.annualVolume ?? null,
        drawingNo: prev?.drawingNo ?? null,
        processRoute: prev?.processRoute ?? null,
        fgWeight: prev?.fgWeight ?? null,
        grossWeight: prev?.grossWeight ?? null,
        drawingReceived: prev?.drawingReceived ?? false,
        feasibleStatus: prev?.feasibleStatus ?? 'PENDING',
        itemRemark: row.itemRemark ?? null,
      }
    })

    const input = {
      enquiryDate: values.enquiryDate.format('YYYY-MM-DD'),
      partyId: values.partyId,
      refBy: values.refBy ?? null,
      // Not on the form anymore; keep any value saved earlier.
      refNo: existing?.refNo ?? null,
      remarks: values.remarks ?? null,
      items: itemRows,
    }

    try {
      if (isEdit) await update({ id, input })
      else await create(input)
      message.success(isEdit ? 'Sales enquiry updated' : 'Sales enquiry created')
      navigate('/sales/enquiries')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit ${existing?.enquiryNumber ?? 'Enquiry'}` : 'New Sales Enquiry'}
        subtitle="Customer enquiry for a product — priced later via a quotation"
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Sales Enquiry', href: '/sales/enquiries' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/sales/enquiries')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Save Changes' : 'Save Enquiry'}
            </Button>
          </Space>
        }
      />

      <Card loading={isEdit && isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ enquiryDate: dayjs(), items: [{}] }}
        >
          <FormSection title="Enquiry Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Enquiry Date"
                  name="enquiryDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={10}>
                <Form.Item
                  label="Customer"
                  name="partyId"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select
                    placeholder="Select customer"
                    options={customerOptions}
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item label="Ref By" name="refBy">
                  <Input placeholder="Enquired by" />
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
                      <Row gutter={12}>
                        <Col xs={24} md={11}>
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
                        <Col xs={8} md={4}>
                          <Form.Item
                            label="Qty"
                            name={[field.name, 'qty']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <InputNumber min={0.0001} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={14} md={8}>
                          <Form.Item label="Remark" name={[field.name, 'itemRemark']}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col
                          xs={2}
                          md={1}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add()}
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

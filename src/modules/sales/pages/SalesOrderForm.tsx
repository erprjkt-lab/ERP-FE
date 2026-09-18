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
import type { CSSProperties, FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import { useCreateSalesOrder, useSalesOrder, useUpdateSalesOrder } from '../hooks/useSalesOrders'
import type { SalesOrderItemInput } from '../hooks/useSalesOrders'

// The item rows are a bare grid rather than a table, so the columns need their
// own header — several inputs (discount/tax) default to 0, which hides their
// placeholder and left them unidentifiable.
const ITEM_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 90px 90px 90px 90px 140px 1fr 32px',
  gap: '0 8px',
  alignItems: 'start',
}

const ITEM_COLUMN_LABELS = [
  'Item',
  'Qty',
  'Rate',
  'Discount %',
  'Tax %',
  'Committed Date',
  'Remarks',
  '',
]

const COLUMN_LABEL_STYLE: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'rgba(0,0,0,0.65)',
  paddingBottom: 4,
}

interface ItemRowValues {
  itemId: string
  qty: number
  rate: number
  discountPercent?: number
  taxPercent?: number
  committedDate?: dayjs.Dayjs
  itemRemark?: string
}

interface OrderFormValues {
  orderDate: dayjs.Dayjs
  partyId: string
  customerPoNo?: string
  customerPoDate?: dayjs.Dayjs
  gstin?: string
  partyStateCode?: string
  remarks?: string
  items: ItemRowValues[]
}

export const SalesOrderForm: FC = () => {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<OrderFormValues>()

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { data: existing, isLoading } = useSalesOrder(id)
  const { mutateAsync: create, isPending: creating } = useCreateSalesOrder()
  const { mutateAsync: update, isPending: updating } = useUpdateSalesOrder()

  const customerOptions = customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  useEffect(() => {
    if (!existing) return
    form.setFieldsValue({
      orderDate: dayjs(existing.orderDate),
      partyId: String(existing.partyId),
      customerPoNo: existing.customerPoNo ?? undefined,
      customerPoDate: existing.customerPoDate ? dayjs(existing.customerPoDate) : undefined,
      gstin: existing.gstin ?? undefined,
      partyStateCode: existing.partyStateCode ?? undefined,
      remarks: existing.remarks ?? undefined,
      items: existing.items.map(item => ({
        itemId: String(item.itemId),
        qty: item.qty,
        rate: item.rate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        committedDate: item.committedDate ? dayjs(item.committedDate) : undefined,
        itemRemark: item.itemRemark ?? undefined,
      })),
    })
  }, [existing, form])

  const handleFinish = async (values: OrderFormValues) => {
    const itemRows: SalesOrderItemInput[] = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      return {
        itemId: row.itemId,
        uomId: item?.uomId ?? null,
        qty: row.qty,
        rate: row.rate,
        discountPercent: row.discountPercent ?? null,
        taxPercent: row.taxPercent ?? null,
        committedDate: row.committedDate ? row.committedDate.format('YYYY-MM-DD') : null,
        itemRemark: row.itemRemark ?? null,
      }
    })

    const input = {
      partyId: values.partyId,
      partyStateCode: values.partyStateCode ?? null,
      gstin: values.gstin ?? null,
      orderDate: values.orderDate.format('YYYY-MM-DD'),
      customerPoNo: values.customerPoNo ?? null,
      customerPoDate: values.customerPoDate ? values.customerPoDate.format('YYYY-MM-DD') : null,
      remarks: values.remarks ?? null,
      items: itemRows,
    }

    try {
      const order = isEdit ? await update({ id, input }) : await create(input)
      message.success(isEdit ? 'Sales order updated' : 'Sales order created')
      navigate(`/sales/orders/${order.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit ${existing?.orderNumber ?? 'Sales Order'}` : 'New Sales Order'}
        subtitle="Direct sales order (not created from a quotation)"
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Sales Order', href: '/sales/orders' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/sales/orders')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Save Changes' : 'Save Sales Order'}
            </Button>
          </Space>
        }
      />

      <Card loading={isEdit && isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ orderDate: dayjs(), items: [] }}
        >
          <FormSection title="Order Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Order Date"
                  name="orderDate"
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
              <Col xs={24} sm={12} md={4}>
                <Form.Item label="Customer PO No" name="customerPoNo">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Form.Item label="Customer PO Date" name="customerPoDate">
                  <DatePicker style={{ width: '100%' }} />
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
                  {fields.length > 0 && (
                    <div style={ITEM_GRID} aria-hidden>
                      {ITEM_COLUMN_LABELS.map(label => (
                        <span key={label} style={COLUMN_LABEL_STYLE}>
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  {fields.map(field => (
                    <div key={field.key} style={ITEM_GRID}>
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
                        <InputNumber placeholder="Qty" min={0.0001} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'rate']}
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <InputNumber placeholder="Rate" min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'discountPercent']}>
                        <InputNumber
                          placeholder="Disc %"
                          min={0}
                          max={100}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'taxPercent']}>
                        <InputNumber placeholder="Tax %" min={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'committedDate']}>
                        <DatePicker placeholder="Committed" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'itemRemark']}>
                        <Input placeholder="Remarks" />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ discountPercent: 0, taxPercent: 0 })}
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

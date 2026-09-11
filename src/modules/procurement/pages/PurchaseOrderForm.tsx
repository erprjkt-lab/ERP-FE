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
import { useNavigate } from 'react-router-dom'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useSuppliers } from '@/modules/masters/hooks/useSuppliers'
import { useProcurementItems } from '../hooks/useProcurementItems'
import { useCreatePurchaseOrderDirect } from '../hooks/usePurchaseOrders'
import type { PurchaseOrderItemInput } from '../hooks/usePurchaseOrders'

interface ItemRowValues {
  itemId: string
  orderedQty: number
  rate: number
  discountPercent: number
  taxPercent: number
  deliveryDate?: dayjs.Dayjs
  remarks?: string
}

export const PurchaseOrderForm: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: suppliers = [] } = useSuppliers()
  const { data: items } = useProcurementItems()
  const { mutateAsync: createDirect, isPending: creating } = useCreatePurchaseOrderDirect()

  const supplierOptions = suppliers.map(s => ({ label: `${s.code} — ${s.name}`, value: s.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  const handleFinish = async (values: {
    poDate: dayjs.Dayjs
    supplierId: string
    paymentTerms?: string
    deliveryTerms?: string
    freightAmount: number
    otherCharges: number
    remarks?: string
    items: ItemRowValues[]
  }) => {
    const supplier = suppliers.find(s => s.id === values.supplierId)
    const itemRows: PurchaseOrderItemInput[] = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      return {
        itemId: row.itemId,
        itemName: item?.name,
        orderedQty: row.orderedQty,
        uomId: item?.uomId ?? null,
        uomName: item?.uomName,
        rate: row.rate,
        discountPercent: row.discountPercent,
        taxPercent: row.taxPercent,
        deliveryDate: row.deliveryDate ? row.deliveryDate.format('YYYY-MM-DD') : null,
        remarks: row.remarks,
      }
    })

    try {
      const po = await createDirect({
        poDate: values.poDate.format('YYYY-MM-DD'),
        supplierId: values.supplierId,
        supplierName: supplier?.name,
        paymentTerms: values.paymentTerms,
        deliveryTerms: values.deliveryTerms,
        freightAmount: values.freightAmount ?? 0,
        otherCharges: values.otherCharges ?? 0,
        remarks: values.remarks,
        items: itemRows,
      })
      message.success('Purchase order created successfully')
      navigate(`/purchase/orders/${po.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title="New Purchase Order"
        subtitle="Direct purchase order (not linked to an enquiry)"
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'Purchase Order', href: '/purchase/orders' },
          { label: 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/purchase/orders')}>Cancel</Button>
            <Button type="primary" loading={creating} onClick={() => form.submit()}>
              Save Purchase Order
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
            poDate: dayjs(),
            freightAmount: 0,
            otherCharges: 0,
            items: [],
          }}
        >
          <FormSection title="Order Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label="PO Date"
                  name="poDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={12}>
                <Form.Item
                  label="Supplier"
                  name="supplierId"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select
                    placeholder="Select supplier"
                    options={supplierOptions}
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
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
                    <div
                      key={field.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 90px 90px 90px 90px 130px 1fr 32px',
                        gap: '0 8px',
                        alignItems: 'start',
                      }}
                    >
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
                        name={[field.name, 'orderedQty']}
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
                        <InputNumber
                          placeholder="Tax %"
                          min={0}
                          max={100}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'deliveryDate']}>
                        <DatePicker placeholder="Delivery" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'remarks']}>
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

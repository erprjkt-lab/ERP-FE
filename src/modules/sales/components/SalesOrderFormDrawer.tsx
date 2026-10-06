import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import { useCreateSalesOrder, useSalesOrder, useUpdateSalesOrder } from '../hooks/useSalesOrders'
import type { SalesOrderItemInput } from '../hooks/useSalesOrders'

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

export interface SalesOrderFormDrawerProps {
  open: boolean
  onClose: () => void
  orderId?: string
}

export const SalesOrderFormDrawer: FC<SalesOrderFormDrawerProps> = ({ open, onClose, orderId }) => {
  const isEdit = !!orderId
  const { message } = App.useApp()
  const [form] = Form.useForm<OrderFormValues>()

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { data: existing } = useSalesOrder(orderId)
  const { mutateAsync: create, isPending: creating } = useCreateSalesOrder()
  const { mutateAsync: update, isPending: updating } = useUpdateSalesOrder()

  // Backend only permits edits while the order is still a draft.
  const isLocked = isEdit && !!existing && existing.status !== 'DRAFT'

  const customerOptions = customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))
  const watchedItems = Form.useWatch('items', form) as ItemRowValues[] | undefined

  useEffect(() => {
    if (!open) return
    if (existing) {
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
    } else {
      form.resetFields()
    }
  }, [open, existing, form])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    if (isLocked) return
    const values = await form.validateFields()

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
      if (isEdit) await update({ id: orderId, input })
      else await create(input)
      message.success(isEdit ? 'Sales order updated' : 'Sales order created')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={isEdit ? `Edit ${existing?.orderNumber ?? 'Sales Order'}` : 'New Sales Order'}
      open={open}
      width={960}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Save Changes' : 'Save Sales Order'}
      hideFooter={isLocked}
    >
      {isLocked ? (
        <Typography.Text>
          This order can no longer be edited — it has already been confirmed, closed or cancelled.
        </Typography.Text>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ orderDate: dayjs(), items: [{ discountPercent: 0, taxPercent: 0 }] }}
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
                  {fields.map(field => {
                    const selectedElsewhere = new Set(
                      (watchedItems ?? [])
                        .filter((_, idx) => idx !== field.name)
                        .map(row => row?.itemId)
                        .filter(Boolean),
                    )
                    const rowItemOptions = itemOptions.filter(
                      opt => !selectedElsewhere.has(opt.value),
                    )
                    return (
                      <div
                        key={field.key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 90px 90px 90px 90px 140px 1fr 32px',
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
                            options={rowItemOptions}
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
                    )
                  })}
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
      )}
    </FormDrawer>
  )
}

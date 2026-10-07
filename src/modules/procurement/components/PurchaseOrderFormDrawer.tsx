import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, DatePicker, Form, Input, InputNumber, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useSuppliers } from '@/modules/masters/hooks/useSuppliers'
import { PO_STATUS_BADGE, PO_STATUS_LABELS } from '../constants'
import { useProcurementItems } from '../hooks/useProcurementItems'
import {
  useCreatePurchaseOrderDirect,
  usePurchaseOrder,
  useUpdatePurchaseOrder,
} from '../hooks/usePurchaseOrders'
import type { PurchaseOrderItemInput } from '../hooks/usePurchaseOrders'
import { getErrorMessage } from '@/api/client'

interface ItemRowValues {
  itemId: string
  orderedQty: number
  rate: number
  discountPercent: number
  taxPercent: number
  deliveryDate?: dayjs.Dayjs
  remarks?: string
}

export interface PurchaseOrderFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Omit to create a new purchase order; pass an id to edit that one. */
  orderId?: string
}

export const PurchaseOrderFormDrawer: FC<PurchaseOrderFormDrawerProps> = ({
  open,
  onClose,
  orderId,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!orderId

  const { data: order } = usePurchaseOrder(orderId)
  const { data: suppliers = [] } = useSuppliers()
  const { data: items } = useProcurementItems()
  const { mutateAsync: createDirect, isPending: creating } = useCreatePurchaseOrderDirect()
  const { mutateAsync: updateOrder, isPending: updating } = useUpdatePurchaseOrder()

  const supplierOptions = suppliers.map(s => ({ label: `${s.code} — ${s.name}`, value: s.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  // Only pending-approval purchase orders can be edited — enforced by ERP-BE's
  // PurchaseOrderService::updateOrder.
  const isLocked = isEdit && order && order.status !== 'PENDING_APPROVAL'

  useEffect(() => {
    if (!open) return
    if (isEdit && order) {
      form.setFieldsValue({
        poDate: dayjs(order.poDate),
        supplierId: order.supplierId,
        paymentTerms: order.paymentTerms,
        deliveryTerms: order.deliveryTerms,
        freightAmount: order.freightAmount,
        otherCharges: order.otherCharges,
        remarks: order.remarks,
        items: order.items.map(item => ({
          itemId: item.itemId,
          orderedQty: item.orderedQty,
          rate: item.rate,
          discountPercent: item.discountPercent,
          taxPercent: item.taxPercent,
          deliveryDate: item.deliveryDate ? dayjs(item.deliveryDate) : undefined,
          remarks: item.remarks,
        })),
      })
    } else if (!isEdit) {
      form.resetFields()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, order?.id, form])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    if (isLocked) return
    let values: {
      poDate: dayjs.Dayjs
      supplierId: string
      paymentTerms?: string
      deliveryTerms?: string
      freightAmount: number
      otherCharges: number
      remarks?: string
      items: ItemRowValues[]
    }
    try {
      values = await form.validateFields()
    } catch {
      return
    }

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

    const payload = {
      poDate: values.poDate.format('YYYY-MM-DD'),
      supplierId: values.supplierId,
      supplierName: supplier?.name,
      paymentTerms: values.paymentTerms,
      deliveryTerms: values.deliveryTerms,
      freightAmount: values.freightAmount ?? 0,
      otherCharges: values.otherCharges ?? 0,
      remarks: values.remarks,
      items: itemRows,
    }

    try {
      if (isEdit && order) {
        await updateOrder({ id: order.id, payload })
      } else {
        await createDirect(payload)
      }
      message.success(`Purchase order ${isEdit ? 'updated' : 'created'} successfully`)
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
      status={isEdit && order ? PO_STATUS_BADGE[order.status] : undefined}
      statusLabel={isEdit && order ? PO_STATUS_LABELS[order.status] : undefined}
      open={open}
      width={960}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Update Purchase Order' : 'Save Purchase Order'}
      hideFooter={!!isLocked}
    >
      {isLocked ? (
        <Typography.Text>
          A purchase order can only be edited while in draft status. This order is {order?.status}.
        </Typography.Text>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            poDate: dayjs(),
            freightAmount: 0,
            otherCharges: 0,
            items: [{ discountPercent: 0, taxPercent: 0 }],
          }}
        >
          <FormSection title="Order Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                label="PO Date"
                name="poDate"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
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
            </div>
          </FormSection>

          <FormSection title="Terms & Charges">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item label="Payment Terms" name="paymentTerms">
                <Input />
              </Form.Item>
              <Form.Item label="Delivery Terms" name="deliveryTerms">
                <Input />
              </Form.Item>
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
      )}
    </FormDrawer>
  )
}

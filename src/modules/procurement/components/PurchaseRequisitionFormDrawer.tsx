import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, DatePicker, Form, Input, InputNumber, Select, Typography } from 'antd'
import type { FormInstance, FormListFieldData } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useDepartments } from '@/modules/hr/hooks/useDepartments'
import type { Priority } from '@/types/procurement'
import { PRIORITY_OPTIONS, REQUISITION_STATUS_BADGE, REQUISITION_STATUS_LABELS } from '../constants'
import type { ProcurementItemOption } from '../hooks/useProcurementItems'
import { useProcurementItems } from '../hooks/useProcurementItems'
import {
  requisitionDisplayStatus,
  useCreatePurchaseRequisition,
  usePurchaseRequisition,
  useUpdatePurchaseRequisition,
} from '../hooks/usePurchaseRequisitions'
import { getErrorMessage } from '@/api/client'

interface ItemRowValues {
  itemId: string
  itemDescription?: string
  requiredQty: number
  requiredDate?: dayjs.Dayjs
  remarks?: string
}

export interface PurchaseRequisitionFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Omit to create a new requisition; pass an id to edit that one. */
  requisitionId?: string
}

export const PurchaseRequisitionFormDrawer: FC<PurchaseRequisitionFormDrawerProps> = ({
  open,
  onClose,
  requisitionId,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!requisitionId

  const { data: requisition } = usePurchaseRequisition(requisitionId)
  const { data: departments } = useDepartments()
  const { data: items } = useProcurementItems()
  const { mutateAsync: createRequisition, isPending: creating } = useCreatePurchaseRequisition()
  const { mutateAsync: updateRequisition, isPending: updating } = useUpdatePurchaseRequisition()

  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))
  const departmentOptions = (departments ?? []).map(d => ({ label: d.name, value: d.id }))

  // Only PENDING_APPROVAL requisitions can be edited — enforced by ERP-BE's
  // PurchaseRequisitionService::updateRequisition.
  const isLocked = isEdit && requisition && requisition.status !== 'PENDING_APPROVAL'

  useEffect(() => {
    if (!open) return
    if (isEdit && requisition) {
      form.setFieldsValue({
        requisitionDate: dayjs(requisition.requisitionDate),
        departmentId: requisition.departmentId ?? undefined,
        priority: requisition.priority,
        remarks: requisition.remarks,
        items: requisition.items.map(item => ({
          itemId: item.itemId,
          itemDescription: item.itemDescription,
          requiredQty: item.requiredQty,
          requiredDate: item.requiredDate ? dayjs(item.requiredDate) : undefined,
          remarks: item.remarks,
        })),
      })
    } else if (!isEdit) {
      form.resetFields()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, requisition?.id, form])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    if (isLocked) return
    let values: {
      requisitionDate: dayjs.Dayjs
      departmentId?: string
      priority: Priority
      remarks?: string
      items: ItemRowValues[]
    }
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const itemRows = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      return {
        itemId: row.itemId,
        itemCode: item?.code,
        itemName: item?.name,
        itemDescription: row.itemDescription,
        requiredQty: row.requiredQty,
        uomId: item?.uomId ?? null,
        uomName: item?.uomName,
        requiredDate: row.requiredDate ? row.requiredDate.format('YYYY-MM-DD') : null,
        remarks: row.remarks,
      }
    })

    const payload = {
      requisitionDate: values.requisitionDate.format('YYYY-MM-DD'),
      departmentId: values.departmentId ?? null,
      departmentName: departmentOptions.find(d => d.value === values.departmentId)?.label,
      priority: values.priority,
      remarks: values.remarks,
      items: itemRows,
    }

    try {
      if (isEdit && requisition) {
        await updateRequisition({ id: requisition.id, payload })
      } else {
        await createRequisition(payload)
      }
      message.success(`Requisition ${isEdit ? 'updated' : 'created'} successfully`)
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={isEdit ? 'Edit Purchase Requisition' : 'New Purchase Requisition'}
      status={
        isEdit && requisition
          ? REQUISITION_STATUS_BADGE[requisitionDisplayStatus(requisition)]
          : undefined
      }
      statusLabel={
        isEdit && requisition
          ? REQUISITION_STATUS_LABELS[requisitionDisplayStatus(requisition)]
          : undefined
      }
      open={open}
      width={960}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Update Requisition' : 'Save Requisition'}
      hideFooter={!!isLocked}
    >
      {isLocked ? (
        <Typography.Text>
          Only requisitions pending approval can be edited. This requisition is{' '}
          {requisition?.status}.
        </Typography.Text>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ requisitionDate: dayjs(), priority: 'NORMAL', items: [{}] }}
        >
          <FormSection title="Requisition Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                label="Requisition Date"
                name="requisitionDate"
                rules={[{ required: true, message: 'Date is required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Department" name="departmentId">
                <Select
                  placeholder="Select department"
                  options={departmentOptions}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
              <Form.Item label="Priority" name="priority">
                <Select options={PRIORITY_OPTIONS} />
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
                    <RequisitionItemRow
                      key={field.key}
                      field={field}
                      form={form}
                      itemOptions={itemOptions}
                      items={items}
                      onRemove={() => remove(field.name)}
                    />
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
      )}
    </FormDrawer>
  )
}

interface RequisitionItemRowProps {
  field: FormListFieldData
  form: FormInstance
  itemOptions: { label: string; value: string }[]
  items: ProcurementItemOption[]
  onRemove: () => void
}

const RequisitionItemRow: FC<RequisitionItemRowProps> = ({
  field,
  form,
  itemOptions,
  items,
  onRemove,
}) => {
  const selectedItemId = Form.useWatch(['items', field.name, 'itemId'], form) as string | undefined
  const selectedItem = items.find(i => i.id === selectedItemId)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 100px 130px 1fr 32px',
        gap: '0 8px',
        alignItems: 'start',
      }}
    >
      <Form.Item name={[field.name, 'itemId']} rules={[{ required: true, message: 'Required' }]}>
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
      <Form.Item name={[field.name, 'itemDescription']}>
        <Input placeholder="Description" />
      </Form.Item>
      <Form.Item
        name={[field.name, 'requiredQty']}
        rules={[{ required: true, message: 'Required' }]}
      >
        <InputNumber
          placeholder={selectedItem ? selectedItem.uomName : 'Qty'}
          min={0.0001}
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Form.Item name={[field.name, 'requiredDate']}>
        <DatePicker placeholder="Required by" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name={[field.name, 'remarks']}>
        <Input placeholder="Remarks" />
      </Form.Item>
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </div>
  )
}

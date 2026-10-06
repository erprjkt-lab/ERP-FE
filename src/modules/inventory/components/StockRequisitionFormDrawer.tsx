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
import type { FormListFieldData } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useDepartments } from '@/modules/hr/hooks/useDepartments'
import { useEmployees } from '@/modules/hr/hooks/useEmployees'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ProcurementItemOption } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockRequisitionPriority } from '@/types/inventory'
import { STOCK_REQUISITION_PRIORITY_OPTIONS, STOCK_REQUISITION_STATUS_BADGE } from '../constants'
import type { StockRequisitionItemInput } from '../hooks/useStockRequisitions'
import {
  useCreateStockRequisition,
  useStockRequisition,
  useUpdateStockRequisition,
} from '../hooks/useStockRequisitions'

interface ItemRowValues {
  itemId: string
  requiredQty: number
  remarks?: string
}

interface RequisitionFormValues {
  requisitionDate: dayjs.Dayjs
  departmentId?: string
  requestedById?: string
  priority: StockRequisitionPriority
  remarks?: string
  items: ItemRowValues[]
}

export interface StockRequisitionFormDrawerProps {
  open: boolean
  onClose: () => void
  /** When provided, the drawer opens in edit mode for this requisition id. */
  requisitionId?: string
}

export const StockRequisitionFormDrawer: FC<StockRequisitionFormDrawerProps> = ({
  open,
  onClose,
  requisitionId,
}) => {
  const isEdit = !!requisitionId
  const { message } = App.useApp()
  const [form] = Form.useForm<RequisitionFormValues>()

  const { data: departments } = useDepartments()
  const { data: employees } = useEmployees()
  const { data: items } = useProcurementItems()
  const { data: existing } = useStockRequisition(requisitionId)
  const { mutateAsync: create, isPending: creating } = useCreateStockRequisition()
  const { mutateAsync: update, isPending: updating } = useUpdateStockRequisition()

  // Only DRAFT and PENDING_APPROVAL requisitions can be edited
  const isLocked =
    isEdit && !!existing && existing.status !== 'DRAFT' && existing.status !== 'PENDING_APPROVAL'

  const departmentOptions = (departments ?? []).map(d => ({ label: d.name, value: d.id }))
  const employeeOptions = (employees ?? []).map(e => ({ label: e.fullName, value: e.id }))

  useEffect(() => {
    if (!open) return
    if (existing) {
      form.setFieldsValue({
        requisitionDate: dayjs(existing.requisitionDate),
        departmentId: existing.departmentId ?? undefined,
        requestedById: existing.requestedById ?? undefined,
        priority: existing.priority,
        remarks: existing.remarks,
        items: existing.items.map(item => ({
          itemId: item.itemId,
          requiredQty: item.requiredQty,
          remarks: item.remarks,
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

    const itemRows: StockRequisitionItemInput[] = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      return {
        itemId: row.itemId,
        itemCode: item?.code,
        itemName: item?.name,
        requiredQty: row.requiredQty,
        uomId: item?.uomId ?? null,
        uomName: item?.uomName,
        remarks: row.remarks,
      }
    })

    const payload = {
      requisitionDate: values.requisitionDate.format('YYYY-MM-DD'),
      departmentId: values.departmentId ?? null,
      requestedById: values.requestedById ?? null,
      priority: values.priority,
      remarks: values.remarks,
      items: itemRows,
    }

    try {
      if (isEdit && requisitionId) {
        await update({ id: requisitionId, payload })
      } else {
        await create(payload)
      }
      message.success(isEdit ? 'Requisition updated' : 'Requisition created')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const statusBadge = existing ? STOCK_REQUISITION_STATUS_BADGE[existing.status] : undefined

  return (
    <FormDrawer
      title={
        isEdit ? `Edit ${existing?.requisitionNumber ?? 'Requisition'}` : 'New Stock Requisition'
      }
      status={statusBadge}
      statusLabel={existing?.status}
      open={open}
      width={860}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Save Changes' : 'Save Requisition'}
      hideFooter={isLocked}
    >
      {isLocked ? (
        <Typography.Text type="secondary">
          Only DRAFT and PENDING APPROVAL requisitions can be edited. This requisition is currently{' '}
          <strong>{existing?.status}</strong>.
        </Typography.Text>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ requisitionDate: dayjs(), priority: 'NORMAL', items: [{}] }}
        >
          <FormSection title="Requisition Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Requisition Date"
                  name="requisitionDate"
                  rules={[{ required: true, message: 'Date is required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
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
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Requested By" name="requestedById">
                  <Select
                    placeholder="Select employee"
                    options={employeeOptions}
                    allowClear
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
                <Form.Item label="Priority" name="priority">
                  <Select options={STOCK_REQUISITION_PRIORITY_OPTIONS} />
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
                    <RequisitionItemRow
                      key={field.key}
                      field={field}
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
  items: ProcurementItemOption[]
  onRemove: () => void
}

const RequisitionItemRow: FC<RequisitionItemRowProps> = ({ field, items, onRemove }) => {
  const selectedItemId = Form.useWatch(['items', field.name, 'itemId']) as string | undefined
  const selectedItem = items.find(i => i.id === selectedItemId)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 130px 1fr 32px',
        gap: '0 8px',
        alignItems: 'start',
      }}
    >
      <Form.Item name={[field.name, 'itemId']} rules={[{ required: true, message: 'Required' }]}>
        <Select
          placeholder="Select item"
          options={items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))}
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
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
      <Form.Item name={[field.name, 'remarks']}>
        <Input placeholder="Remarks" />
      </Form.Item>
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </div>
  )
}

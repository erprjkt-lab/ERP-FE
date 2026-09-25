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
  Typography,
} from 'antd'
import type { FormListFieldData } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useDepartments } from '@/modules/hr/hooks/useDepartments'
import { useEmployees } from '@/modules/hr/hooks/useEmployees'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ProcurementItemOption } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockRequisitionPriority } from '@/types/inventory'
import { STOCK_REQUISITION_PRIORITY_OPTIONS } from '../constants'
import type { StockRequisitionItemInput } from '../hooks/useStockRequisitions'
import {
  useCreateStockRequisition,
  useStockRequisition,
  useUpdateStockRequisition,
} from '../hooks/useStockRequisitions'
import { getErrorMessage } from '@/api/client'

interface ItemRowValues {
  itemId: string
  requiredQty: number
  remarks?: string
}

export const StockRequisitionForm: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!id

  const { data: requisition } = useStockRequisition(id)
  const { data: departments } = useDepartments()
  const { data: employees } = useEmployees()
  const { data: items } = useProcurementItems()
  const { mutateAsync: createRequisition, isPending: creating } = useCreateStockRequisition()
  const { mutateAsync: updateRequisition, isPending: updating } = useUpdateStockRequisition()

  const departmentOptions = (departments ?? []).map(d => ({ label: d.name, value: d.id }))
  const employeeOptions = (employees ?? []).map(e => ({ label: e.fullName, value: e.id }))

  useEffect(() => {
    if (isEdit && requisition) {
      form.setFieldsValue({
        requisitionDate: dayjs(requisition.requisitionDate),
        departmentId: requisition.departmentId ?? undefined,
        requestedById: requisition.requestedById ?? undefined,
        priority: requisition.priority,
        remarks: requisition.remarks,
        items: requisition.items.map(item => ({
          itemId: item.itemId,
          requiredQty: item.requiredQty,
          remarks: item.remarks,
        })),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, requisition?.id, form])

  if (isEdit && requisition && requisition.status !== 'DRAFT') {
    return (
      <div>
        <PageHeader
          title="Edit Stock Requisition"
          breadcrumbs={[
            { label: 'Inventory' },
            { label: 'Stock Requisitions', href: '/inventory/requisitions' },
          ]}
        />
        <Card>
          <Typography.Text>
            Only DRAFT requisitions can be edited. This requisition is {requisition.status}.
          </Typography.Text>
        </Card>
      </div>
    )
  }

  const handleFinish = async (values: {
    requisitionDate: dayjs.Dayjs
    departmentId?: string
    requestedById?: string
    priority: StockRequisitionPriority
    remarks?: string
    items: ItemRowValues[]
  }) => {
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
      let requisitionId = requisition?.id
      if (isEdit && requisition) {
        await updateRequisition({ id: requisition.id, payload })
      } else {
        const created = await createRequisition(payload)
        requisitionId = created.id
      }
      message.success(`Requisition ${isEdit ? 'updated' : 'created'} successfully`)
      navigate(`/inventory/requisitions/${requisitionId}`)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Stock Requisition' : 'New Stock Requisition'}
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Requisitions', href: '/inventory/requisitions' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <>
            <Button onClick={() => navigate('/inventory/requisitions')} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Update' : 'Save'} Requisition
            </Button>
          </>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ requisitionDate: dayjs(), priority: 'NORMAL', items: [] }}
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
      </Card>
    </div>
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

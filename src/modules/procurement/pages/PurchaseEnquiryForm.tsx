import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { useSuppliers } from '@/modules/masters/hooks/useSuppliers'
import type { Priority } from '@/types/procurement'
import { PRIORITY_OPTIONS } from '../constants'
import { useProcurementItems } from '../hooks/useProcurementItems'
import {
  useCreatePurchaseEnquiryFromRequisitions,
  useCreatePurchaseEnquiryManual,
} from '../hooks/usePurchaseEnquiries'
import type {
  PurchaseEnquiryItemInput,
  PurchaseEnquirySupplierInput,
} from '../hooks/usePurchaseEnquiries'
import { usePurchaseRequisitions } from '../hooks/usePurchaseRequisitions'

type Mode = 'manual' | 'fromRequisitions'

interface ManualItemRowValues {
  itemId: string
  itemDescription?: string
  requiredQty: number
  requiredDate?: dayjs.Dayjs
  preferredDeliveryDate?: dayjs.Dayjs
  remarks?: string
}

export const PurchaseEnquiryForm: FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromPr = searchParams.get('fromPr')
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [mode, setMode] = useState<Mode>(fromPr ? 'fromRequisitions' : 'manual')

  const { data: suppliers = [] } = useSuppliers()
  const { data: items } = useProcurementItems()
  const { data: requisitions } = usePurchaseRequisitions()
  const { mutateAsync: createManual, isPending: creatingManual } = useCreatePurchaseEnquiryManual()
  const { mutateAsync: createFromRequisitions, isPending: creatingFromPr } =
    useCreatePurchaseEnquiryFromRequisitions()

  const supplierOptions = suppliers.map(s => ({ label: `${s.code} — ${s.name}`, value: s.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))
  const approvedRequisitions = requisitions.filter(
    pr => pr.status === 'APPROVED' && pr.items.some(item => item.pendingQty > 0),
  )
  const requisitionOptions = approvedRequisitions.map(pr => ({
    label: `${pr.requisitionNumber} (${pr.items.filter(i => i.pendingQty > 0).length} pending items)`,
    value: pr.id,
  }))

  const buildSuppliers = (supplierIds: string[]): PurchaseEnquirySupplierInput[] =>
    supplierIds.map(id => {
      const supplier = suppliers.find(s => s.id === id)
      return { supplierId: id, supplierCode: supplier?.code, supplierName: supplier?.name }
    })

  const handleFinish = async (values: {
    enquiryDate: dayjs.Dayjs
    enquiryDueDate?: dayjs.Dayjs
    priority: Priority
    remarks?: string
    supplierIds: string[]
    items?: ManualItemRowValues[]
    requisitionIds?: string[]
  }) => {
    try {
      let enquiryId: string
      if (mode === 'manual') {
        const itemRows: PurchaseEnquiryItemInput[] = (values.items ?? []).map(row => {
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
            preferredDeliveryDate: row.preferredDeliveryDate
              ? row.preferredDeliveryDate.format('YYYY-MM-DD')
              : null,
            remarks: row.remarks,
          }
        })
        const created = await createManual({
          enquiryDate: values.enquiryDate.format('YYYY-MM-DD'),
          enquiryDueDate: values.enquiryDueDate ? values.enquiryDueDate.format('YYYY-MM-DD') : null,
          priority: values.priority,
          remarks: values.remarks,
          items: itemRows,
          suppliers: buildSuppliers(values.supplierIds),
        })
        enquiryId = created.id
      } else {
        const created = await createFromRequisitions({
          requisitionIds: values.requisitionIds ?? [],
          enquiryDate: values.enquiryDate.format('YYYY-MM-DD'),
          enquiryDueDate: values.enquiryDueDate ? values.enquiryDueDate.format('YYYY-MM-DD') : null,
          priority: values.priority,
          remarks: values.remarks,
          suppliers: buildSuppliers(values.supplierIds),
        })
        enquiryId = created.id
      }
      message.success('Purchase enquiry created successfully')
      navigate(`/purchase/enquiries/${enquiryId}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title="New Purchase Enquiry"
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'Enquiries', href: '/purchase/enquiries' },
          { label: 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/purchase/enquiries')}>Cancel</Button>
            <Button
              type="primary"
              loading={creatingManual || creatingFromPr}
              onClick={() => form.submit()}
            >
              Save Enquiry
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
            priority: 'NORMAL',
            items: [],
            requisitionIds: fromPr ? [fromPr] : [],
          }}
        >
          <Form.Item label="Source">
            <Radio.Group value={mode} onChange={e => setMode(e.target.value as Mode)}>
              <Radio.Button value="manual">Manual Entry</Radio.Button>
              <Radio.Button value="fromRequisitions">From Purchase Requisitions</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
            <Form.Item
              label="Enquiry Date"
              name="enquiryDate"
              rules={[{ required: true, message: 'Date is required' }]}
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Due Date" name="enquiryDueDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Priority" name="priority">
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>
          </div>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            label="Suppliers"
            name="supplierIds"
            rules={[{ required: true, message: 'Add at least one supplier' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select suppliers"
              options={supplierOptions}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          {mode === 'fromRequisitions' ? (
            <Form.Item
              label="Purchase Requisitions"
              name="requisitionIds"
              rules={[{ required: true, message: 'Select at least one requisition' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select approved requisitions with pending items"
                options={requisitionOptions}
              />
            </Form.Item>
          ) : (
            <>
              <Typography.Title level={5}>Items</Typography.Title>
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
                          gridTemplateColumns: '2fr 1fr 100px 130px 130px 1fr 32px',
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
                        <Form.Item name={[field.name, 'itemDescription']}>
                          <Input placeholder="Description" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'requiredQty']}
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <InputNumber placeholder="Qty" min={0.0001} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name={[field.name, 'requiredDate']}>
                          <DatePicker placeholder="Required by" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name={[field.name, 'preferredDeliveryDate']}>
                          <DatePicker placeholder="Preferred delivery" style={{ width: '100%' }} />
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
                      onClick={() => add()}
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      Add Item
                    </Button>
                  </>
                )}
              </Form.List>
            </>
          )}
        </Form>
      </Card>
    </div>
  )
}

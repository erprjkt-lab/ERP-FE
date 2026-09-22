import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select } from 'antd'
import type { FormListFieldData } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ProcurementItemOption } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockAdjustmentReason } from '@/types/inventory'
import { STOCK_ADJUSTMENT_REASON_OPTIONS } from '../constants'
import { useCreateStockAdjustment } from '../hooks/useStockAdjustments'
import type { StockAdjustmentItemInput } from '../hooks/useStockAdjustments'
import { useLocations } from '../hooks/useLocations'
import { getErrorMessage } from '@/api/client'

interface ItemRowValues {
  itemId: string
  batchNo?: string
  heatNo?: string
  physicalQty: number
  remarks?: string
}

export const StockAdjustmentForm: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: items } = useProcurementItems()
  const { data: locations } = useLocations()
  const { mutateAsync: createAdjustment, isPending: creating } = useCreateStockAdjustment()

  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }))

  const handleFinish = async (values: {
    adjustmentDate: dayjs.Dayjs
    locationId: string
    reason: StockAdjustmentReason
    remarks?: string
    items: ItemRowValues[]
  }) => {
    const itemRows: StockAdjustmentItemInput[] = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      return {
        itemId: row.itemId,
        itemCode: item?.code,
        itemName: item?.name,
        batchNo: row.batchNo,
        heatNo: row.heatNo,
        physicalQty: row.physicalQty,
        remarks: row.remarks,
      }
    })

    try {
      const created = await createAdjustment({
        adjustmentDate: values.adjustmentDate.format('YYYY-MM-DD'),
        locationId: values.locationId,
        reason: values.reason,
        remarks: values.remarks,
        items: itemRows,
      })
      message.success('Stock adjustment created')
      navigate(`/inventory/adjustments/${created.id}`)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="New Stock Adjustment"
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Adjustments', href: '/inventory/adjustments' },
          { label: 'New' },
        ]}
        actions={
          <>
            <Button onClick={() => navigate('/inventory/adjustments')} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" loading={creating} onClick={() => form.submit()}>
              Save Adjustment
            </Button>
          </>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            adjustmentDate: dayjs(),
            reason: 'PHYSICAL_COUNT',
            items: [],
          }}
        >
          <FormSection title="Adjustment Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Adjustment Date"
                  name="adjustmentDate"
                  rules={[{ required: true, message: 'Date is required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Location"
                  name="locationId"
                  rules={[{ required: true, message: 'Location is required' }]}
                >
                  <Select
                    placeholder="Select location"
                    options={locationOptions}
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
                <Form.Item label="Reason" name="reason">
                  <Select options={STOCK_ADJUSTMENT_REASON_OPTIONS} />
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
                    <AdjustmentItemRow
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

interface AdjustmentItemRowProps {
  field: FormListFieldData
  items: ProcurementItemOption[]
  onRemove: () => void
}

const AdjustmentItemRow: FC<AdjustmentItemRowProps> = ({ field, items, onRemove }) => {
  const selectedItemId = Form.useWatch(['items', field.name, 'itemId']) as string | undefined
  const selectedItem = items.find(i => i.id === selectedItemId)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 100px 1fr 32px',
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
        name={[field.name, 'batchNo']}
        rules={
          selectedItem?.batchTracking
            ? [{ required: true, message: 'Batch no. required for this item' }]
            : []
        }
      >
        <Input placeholder={selectedItem?.batchTracking ? 'Batch No (required)' : 'Batch No'} />
      </Form.Item>
      <Form.Item
        name={[field.name, 'heatNo']}
        rules={
          selectedItem?.heatTracking
            ? [{ required: true, message: 'Heat no. required for this item' }]
            : []
        }
      >
        <Input placeholder={selectedItem?.heatTracking ? 'Heat No (required)' : 'Heat No'} />
      </Form.Item>
      <Form.Item
        name={[field.name, 'physicalQty']}
        rules={[{ required: true, message: 'Required' }]}
      >
        <InputNumber
          placeholder={selectedItem ? `Physical qty (${selectedItem.uomName})` : 'Physical qty'}
          min={0}
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

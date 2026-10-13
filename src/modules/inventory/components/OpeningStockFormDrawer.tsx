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
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ProcurementItemOption } from '@/modules/procurement/hooks/useProcurementItems'
import { useCreateOpeningStock } from '../hooks/useOpeningStocks'
import { useLocations } from '../hooks/useLocations'

interface ItemRowValues {
  itemId: string
  locationId: string
  batchNo?: string
  heatNo?: string
  serialNo?: string
  qty: number
  rate?: number
  remarks?: string
}

interface OpeningStockFormValues {
  entryDate: dayjs.Dayjs
  remarks?: string
  items: ItemRowValues[]
}

export interface OpeningStockFormDrawerProps {
  open: boolean
  onClose: () => void
}

export const OpeningStockFormDrawer: FC<OpeningStockFormDrawerProps> = ({ open, onClose }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<OpeningStockFormValues>()

  const { data: items } = useProcurementItems()
  const { data: locations } = useLocations()
  const { mutateAsync: createEntry, isPending: creating } = useCreateOpeningStock()

  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }))

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    try {
      await createEntry({
        entryDate: values.entryDate.format('YYYY-MM-DD'),
        remarks: values.remarks,
        items: values.items.map(row => ({
          itemId: row.itemId,
          locationId: row.locationId,
          batchNo: row.batchNo,
          heatNo: row.heatNo,
          serialNo: row.serialNo,
          qty: row.qty,
          rate: row.rate,
          remarks: row.remarks,
        })),
      })
      message.success('Opening stock posted')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title="New Opening Stock"
      open={open}
      width={1000}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating}
      submitText="Post Opening Stock"
    >
      <Form form={form} layout="vertical" initialValues={{ entryDate: dayjs(), items: [{}] }}>
        <FormSection title="Entry Details">
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Entry Date"
                name="entryDate"
                rules={[{ required: true, message: 'Date is required' }]}
              >
                {/* ERP-BE rejects a future entry date. */}
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={date => date.isAfter(dayjs(), 'day')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item label="Remarks" name="remarks">
                <Input placeholder="e.g. Go-live stock count" />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            Posting adds this quantity straight to the stock ledger — there is no approval step.
          </Typography.Text>
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
                  <OpeningStockItemRow
                    key={field.key}
                    field={field}
                    items={items}
                    locationOptions={locationOptions}
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
    </FormDrawer>
  )
}

interface OpeningStockItemRowProps {
  field: FormListFieldData
  items: ProcurementItemOption[]
  locationOptions: { label: string; value: string }[]
  onRemove: () => void
}

const OpeningStockItemRow: FC<OpeningStockItemRowProps> = ({
  field,
  items,
  locationOptions,
  onRemove,
}) => {
  const selectedItemId = Form.useWatch(['items', field.name, 'itemId']) as string | undefined
  const selectedItem = items.find(i => i.id === selectedItemId)

  const searchFilter = (input: string, option?: { label?: string }) =>
    String(option?.label ?? '')
      .toLowerCase()
      .includes(input.toLowerCase())

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.4fr 1fr 1fr 100px 100px 32px',
        gap: '0 8px',
        alignItems: 'start',
      }}
    >
      <Form.Item name={[field.name, 'itemId']} rules={[{ required: true, message: 'Required' }]}>
        <Select
          placeholder="Select item"
          options={items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))}
          showSearch
          filterOption={searchFilter}
        />
      </Form.Item>
      <Form.Item
        name={[field.name, 'locationId']}
        rules={[{ required: true, message: 'Required' }]}
      >
        <Select
          placeholder="Location"
          options={locationOptions}
          showSearch
          filterOption={searchFilter}
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
      <Form.Item name={[field.name, 'qty']} rules={[{ required: true, message: 'Required' }]}>
        <InputNumber
          placeholder={selectedItem ? `Qty (${selectedItem.uomName})` : 'Qty'}
          min={0.001}
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Form.Item name={[field.name, 'rate']}>
        <InputNumber placeholder="Rate" min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </div>
  )
}

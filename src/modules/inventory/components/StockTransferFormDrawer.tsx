import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  AutoComplete,
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
import { useCreateStockTransfer } from '../hooks/useStockTransfers'
import { useLocations } from '../hooks/useLocations'
import { useStockBalance } from '../hooks/useStockBalance'

interface ItemRowValues {
  itemId: string
  batchNo?: string
  heatNo?: string
  serialNo?: string
  qty: number
  remarks?: string
}

interface TransferFormValues {
  transferDate: dayjs.Dayjs
  fromLocationId: string
  toLocationId: string
  remarks?: string
  items: ItemRowValues[]
}

export interface StockTransferFormDrawerProps {
  open: boolean
  onClose: () => void
}

export const StockTransferFormDrawer: FC<StockTransferFormDrawerProps> = ({ open, onClose }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<TransferFormValues>()

  const { data: items } = useProcurementItems()
  const { data: locations } = useLocations()
  const { mutateAsync: createTransfer, isPending: creating } = useCreateStockTransfer()

  const fromLocationId = Form.useWatch('fromLocationId', form) as string | undefined
  const toLocationId = Form.useWatch('toLocationId', form) as string | undefined
  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }))

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    try {
      await createTransfer({
        transferDate: values.transferDate.format('YYYY-MM-DD'),
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        remarks: values.remarks,
        items: values.items.map(row => ({
          itemId: row.itemId,
          batchNo: row.batchNo,
          heatNo: row.heatNo,
          serialNo: row.serialNo,
          qty: row.qty,
          remarks: row.remarks,
        })),
      })
      message.success('Stock transfer posted')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title="New Stock Transfer"
      open={open}
      width={1000}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating}
      submitText="Post Transfer"
    >
      <Form form={form} layout="vertical" initialValues={{ transferDate: dayjs(), items: [{}] }}>
        <FormSection title="Transfer Details">
          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Transfer Date"
                name="transferDate"
                rules={[{ required: true, message: 'Date is required' }]}
              >
                {/* ERP-BE rejects a future transfer date. */}
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={date => date.isAfter(dayjs(), 'day')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="From Location"
                name="fromLocationId"
                rules={[{ required: true, message: 'Source location is required' }]}
              >
                <Select
                  placeholder="Move stock out of"
                  options={locationOptions.filter(o => o.value !== toLocationId)}
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
              <Form.Item
                label="To Location"
                name="toLocationId"
                rules={[{ required: true, message: 'Destination location is required' }]}
              >
                <Select
                  placeholder="Move stock into"
                  options={locationOptions.filter(o => o.value !== fromLocationId)}
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
              <Form.Item label="Remarks" name="remarks">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            Posting moves the stock in one step — there is no in-transit or approval stage.
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
                  <TransferItemRow
                    key={field.key}
                    field={field}
                    items={items}
                    fromLocationId={fromLocationId}
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

interface TransferItemRowProps {
  field: FormListFieldData
  items: ProcurementItemOption[]
  fromLocationId?: string
  onRemove: () => void
}

const TransferItemRow: FC<TransferItemRowProps> = ({ field, items, fromLocationId, onRemove }) => {
  const selectedItemId = Form.useWatch(['items', field.name, 'itemId']) as string | undefined
  const selectedItem = items.find(i => i.id === selectedItemId)

  // Only lots that actually sit in the source location can be moved out of it.
  const { data: balanceRows } = useStockBalance(selectedItemId)
  const lotsAtSource = fromLocationId
    ? balanceRows.filter(r => r.locationId === fromLocationId)
    : []
  const batchOptions = [...new Set(lotsAtSource.map(r => r.batchNo))].map(value => ({ value }))
  const heatOptions = [...new Set(lotsAtSource.map(r => r.heatNo))].map(value => ({ value }))
  const available = lotsAtSource.reduce((sum, row) => sum + row.qty, 0)
  const autoCompleteFilter = (input: string, option?: { value: string }) =>
    (option?.value ?? '').toLowerCase().includes(input.toLowerCase())

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 120px 1fr 32px',
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
        <AutoComplete
          options={batchOptions}
          filterOption={autoCompleteFilter}
          placeholder={selectedItem?.batchTracking ? 'Batch No (required)' : 'Batch No'}
        />
      </Form.Item>
      <Form.Item
        name={[field.name, 'heatNo']}
        rules={
          selectedItem?.heatTracking
            ? [{ required: true, message: 'Heat no. required for this item' }]
            : []
        }
      >
        <AutoComplete
          options={heatOptions}
          filterOption={autoCompleteFilter}
          placeholder={selectedItem?.heatTracking ? 'Heat No (required)' : 'Heat No'}
        />
      </Form.Item>
      <Form.Item
        name={[field.name, 'qty']}
        rules={[{ required: true, message: 'Required' }]}
        extra={
          selectedItemId && fromLocationId ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {available} available
            </Typography.Text>
          ) : undefined
        }
      >
        <InputNumber
          placeholder={selectedItem ? `Qty (${selectedItem.uomName})` : 'Qty'}
          min={0.001}
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

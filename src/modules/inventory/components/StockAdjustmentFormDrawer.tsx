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
import { useEffect } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ProcurementItemOption } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockAdjustmentReason } from '@/types/inventory'
import { STOCK_ADJUSTMENT_REASON_OPTIONS, STOCK_ADJUSTMENT_STATUS_BADGE } from '../constants'
import type { StockAdjustmentItemInput } from '../hooks/useStockAdjustments'
import {
  useCreateStockAdjustment,
  useStockAdjustment,
  useUpdateStockAdjustment,
} from '../hooks/useStockAdjustments'
import { useLocations } from '../hooks/useLocations'
import { useStockBalance } from '../hooks/useStockBalance'

interface ItemRowValues {
  itemId: string
  batchNo?: string
  heatNo?: string
  physicalQty: number
  remarks?: string
}

interface AdjustmentFormValues {
  adjustmentDate: dayjs.Dayjs
  locationId: string
  reason: StockAdjustmentReason
  remarks?: string
  items: ItemRowValues[]
}

export interface StockAdjustmentFormDrawerProps {
  open: boolean
  onClose: () => void
  /** When provided, the drawer opens in edit mode for this adjustment id. */
  adjustmentId?: string
}

export const StockAdjustmentFormDrawer: FC<StockAdjustmentFormDrawerProps> = ({
  open,
  onClose,
  adjustmentId,
}) => {
  const isEdit = !!adjustmentId
  const { message } = App.useApp()
  const [form] = Form.useForm<AdjustmentFormValues>()

  const { data: items } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: existing } = useStockAdjustment(adjustmentId)
  const { mutateAsync: createAdjustment, isPending: creating } = useCreateStockAdjustment()
  const { mutateAsync: updateAdjustment, isPending: updating } = useUpdateStockAdjustment()

  // Only DRAFT adjustments can be edited
  const isLocked = isEdit && !!existing && existing.status !== 'DRAFT'

  const locationId = Form.useWatch('locationId', form) as string | undefined
  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }))

  useEffect(() => {
    if (!open) return
    if (existing) {
      form.setFieldsValue({
        adjustmentDate: dayjs(existing.adjustmentDate),
        locationId: existing.locationId,
        reason: existing.reason,
        remarks: existing.remarks,
        items: existing.items.map(item => ({
          itemId: item.itemId,
          batchNo: item.batchNo,
          heatNo: item.heatNo,
          physicalQty: item.physicalQty,
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

    const payload = {
      adjustmentDate: values.adjustmentDate.format('YYYY-MM-DD'),
      locationId: values.locationId,
      reason: values.reason,
      remarks: values.remarks,
      items: itemRows,
    }

    try {
      if (isEdit && adjustmentId) {
        await updateAdjustment({ id: adjustmentId, payload })
      } else {
        await createAdjustment(payload)
      }
      message.success(isEdit ? 'Stock adjustment updated' : 'Stock adjustment created')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const statusBadge = existing ? STOCK_ADJUSTMENT_STATUS_BADGE[existing.status] : undefined

  return (
    <FormDrawer
      title={isEdit ? `Edit ${existing?.adjustmentNumber ?? 'Adjustment'}` : 'New Stock Adjustment'}
      status={statusBadge}
      statusLabel={existing?.status}
      open={open}
      width={900}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Save Changes' : 'Save Adjustment'}
      hideFooter={isLocked}
    >
      {isLocked ? (
        <Typography.Text type="secondary">
          Only DRAFT adjustments can be edited. This adjustment is currently{' '}
          <strong>{existing?.status}</strong>.
        </Typography.Text>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            adjustmentDate: dayjs(),
            reason: 'PHYSICAL_COUNT',
            items: [{}],
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
                      locationId={locationId}
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

interface AdjustmentItemRowProps {
  field: FormListFieldData
  items: ProcurementItemOption[]
  locationId?: string
  onRemove: () => void
}

const AdjustmentItemRow: FC<AdjustmentItemRowProps> = ({ field, items, locationId, onRemove }) => {
  const selectedItemId = Form.useWatch(['items', field.name, 'itemId']) as string | undefined
  const selectedItem = items.find(i => i.id === selectedItemId)

  const { data: balanceRows } = useStockBalance(selectedItemId)
  const lotsAtLocation = locationId ? balanceRows.filter(r => r.locationId === locationId) : []
  const batchOptions = [...new Set(lotsAtLocation.map(r => r.batchNo))].map(value => ({ value }))
  const heatOptions = [...new Set(lotsAtLocation.map(r => r.heatNo))].map(value => ({ value }))
  const autoCompleteFilter = (input: string, option?: { value: string }) =>
    (option?.value ?? '').toLowerCase().includes(input.toLowerCase())

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

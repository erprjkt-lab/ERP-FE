import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Col, DatePicker, Form, Input, Row, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { loadMoreRender } from '@/components/ui/loadMoreRender'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockAdjustmentReason } from '@/types/inventory'
import { STOCK_ADJUSTMENT_REASON_OPTIONS, STOCK_ADJUSTMENT_STATUS_BADGE } from '../constants'
import type { StockAdjustmentItemInput } from '../hooks/useStockAdjustments'
import {
  useCreateStockAdjustment,
  useStockAdjustment,
  useUpdateStockAdjustment,
} from '../hooks/useStockAdjustments'
import { useLocations } from '../hooks/useLocations'
import { ItemLotAllocator, lotKey, parseLotKey } from './ItemLotAllocator'
import { deferMount } from '@/components/ui/deferMount'

interface AdjustmentFormValues {
  adjustmentDate: dayjs.Dayjs
  locationId: string
  reason: StockAdjustmentReason
  remarks?: string
}

export interface StockAdjustmentFormDrawerProps {
  open: boolean
  onClose: () => void
  /** When provided, the drawer opens in edit mode for this adjustment id. */
  adjustmentId?: string
}

const StockAdjustmentFormDrawerInner: FC<StockAdjustmentFormDrawerProps> = ({
  open,
  onClose,
  adjustmentId,
}) => {
  const isEdit = !!adjustmentId
  const { message } = App.useApp()
  const [form] = Form.useForm<AdjustmentFormValues>()

  // Items picked for counting, and the physical qty typed against each of their
  // lots: { itemId: { lotKey: physicalQty } }.
  const [countedItems, setCountedItems] = useState<string[]>([])
  const [qtyByItem, setQtyByItem] = useState<Record<string, Record<string, number>>>({})
  const [pendingItemId, setPendingItemId] = useState<string>()

  const { data: items, loadMore: loadMoreItems, hasMore: hasMoreItems } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: existing } = useStockAdjustment(adjustmentId)
  const { mutateAsync: createAdjustment, isPending: creating } = useCreateStockAdjustment()
  const { mutateAsync: updateAdjustment, isPending: updating } = useUpdateStockAdjustment()

  // Only pending-approval adjustments can be edited — approving posts the variance.
  const isLocked = isEdit && !!existing && existing.status !== 'PENDING_APPROVAL'

  const locationId = Form.useWatch('locationId', form) as string | undefined
  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }))
  const itemOptions = items
    .filter(i => !countedItems.includes(i.id))
    .map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  useEffect(() => {
    if (!open) return
    if (existing) {
      form.setFieldsValue({
        adjustmentDate: dayjs(existing.adjustmentDate),
        locationId: existing.locationId,
        reason: existing.reason,
        remarks: existing.remarks,
      })
    } else {
      form.resetFields()
    }
  }, [open, existing, form])

  // The lot allocation is React state, so it is seeded during render rather than
  // from an effect (React's "adjusting state when a prop changes"). `existing`
  // arrives asynchronously, so the key covers both the empty and loaded passes.
  const loadKey = open ? (existing?.id ?? 'new') : 'closed'
  const [loadedKey, setLoadedKey] = useState<string>('closed')
  if (open && loadKey !== loadedKey) {
    setLoadedKey(loadKey)
    // Saved lines come back per lot; rebuild the per-item allocation from them
    // so an edit reopens exactly as it was counted.
    const counted: string[] = []
    const quantities: Record<string, Record<string, number>> = {}
    for (const item of existing?.items ?? []) {
      if (!counted.includes(item.itemId)) counted.push(item.itemId)
      // These have to be the same defaults ERP-BE stores (item_stocks defaults
      // batch_no/heat_no/serial_no to GENERAL/NA/NA), or the key won't match the
      // one ItemLotAllocator builds from the stock balance row and the saved
      // physical qty reopens blank.
      const key = lotKey({
        locationId: existing?.locationId ?? '',
        batchNo: item.batchNo ?? 'GENERAL',
        heatNo: item.heatNo ?? 'NA',
        serialNo: 'NA',
      })
      quantities[item.itemId] = { ...quantities[item.itemId], [key]: item.physicalQty }
    }
    setCountedItems(counted)
    setQtyByItem(quantities)
  }

  const handleClose = () => {
    form.resetFields()
    setCountedItems([])
    setQtyByItem({})
    setPendingItemId(undefined)
    setLoadedKey('closed')
    onClose()
  }

  const handleAddItem = () => {
    if (!pendingItemId) return
    setCountedItems(prev => [...prev, pendingItemId])
    setPendingItemId(undefined)
  }

  const removeItem = (itemId: string) => {
    setCountedItems(prev => prev.filter(id => id !== itemId))
    setQtyByItem(prev => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  const setLotQty = (itemId: string, key: string, qty: number | null) => {
    setQtyByItem(prev => ({ ...prev, [itemId]: { ...prev[itemId], [key]: qty ?? 0 } }))
  }

  const handleSubmit = async () => {
    if (isLocked) return
    const values = await form.validateFields()

    const itemRows: StockAdjustmentItemInput[] = []
    for (const itemId of countedItems) {
      const item = items.find(i => i.id === itemId)
      for (const [key, physicalQty] of Object.entries(qtyByItem[itemId] ?? {})) {
        const { batchNo, heatNo } = parseLotKey(key)
        itemRows.push({
          itemId,
          itemCode: item?.code,
          itemName: item?.name,
          batchNo,
          heatNo,
          physicalQty,
          remarks: undefined,
        })
      }
    }

    if (itemRows.length === 0) {
      message.error('Enter a physical quantity against at least one batch')
      return
    }

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
          Only adjustments pending approval can be edited. This adjustment is currently{' '}
          <strong>{existing?.status}</strong>.
        </Typography.Text>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ adjustmentDate: dayjs(), reason: 'PHYSICAL_COUNT' }}
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
                    // Counted quantities are keyed by the lot they were entered
                    // against, and a lot belongs to one location. Keeping them
                    // across a location change would post the old location's
                    // batches as a variance at the new one.
                    onChange={() => setQtyByItem({})}
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

          <FormSection
            title="Items to Count"
            description="Pick an item to list every batch it holds at this location, then enter the physical quantity counted against each — the placeholder shows the system quantity. Only batches you enter a quantity against are adjusted; ERP-BE works out the variance."
          >
            <Row gutter={12} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={18} md={20}>
                <Select
                  style={{ width: '100%' }}
                  placeholder={locationId ? 'Select an item to count' : 'Select a location first'}
                  disabled={!locationId}
                  value={pendingItemId}
                  onChange={setPendingItemId}
                  options={itemOptions}
                  popupRender={loadMoreRender(hasMoreItems, loadMoreItems)}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Col>
              <Col xs={24} sm={6} md={4}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddItem}
                  disabled={!pendingItemId}
                  style={{ width: '100%' }}
                >
                  Add Item
                </Button>
              </Col>
            </Row>

            {countedItems.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 8,
                  border: '1px dashed rgba(0, 0, 0, 0.15)',
                }}
              >
                <Typography.Text type="secondary">
                  Add an item above to list its batches and enter counted quantities.
                </Typography.Text>
              </div>
            ) : (
              countedItems.map(itemId => {
                const item = items.find(i => i.id === itemId)
                return (
                  <ItemLotAllocator
                    key={itemId}
                    itemId={itemId}
                    title={item ? `${item.code} — ${item.name}` : itemId}
                    locationId={locationId}
                    stockLabel="System Qty"
                    qtyLabel="Physical Qty"
                    capAtStock={false}
                    values={qtyByItem[itemId] ?? {}}
                    onChange={(key, qty) => setLotQty(itemId, key, qty)}
                    onRemove={() => removeItem(itemId)}
                  />
                )
              })
            )}
          </FormSection>
        </Form>
      )}
    </FormDrawer>
  )
}

export const StockAdjustmentFormDrawer = deferMount(StockAdjustmentFormDrawerInner)

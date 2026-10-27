import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Col, DatePicker, Form, Input, Row, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { loadMoreRender } from '@/components/ui/loadMoreRender'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { useCreateStockTransfer } from '../hooks/useStockTransfers'
import { useLocations } from '../hooks/useLocations'
import { ItemLotAllocator, parseLotKey } from './ItemLotAllocator'
import { deferMount } from '@/components/ui/deferMount'

interface TransferFormValues {
  transferDate: dayjs.Dayjs
  fromLocationId: string
  toLocationId: string
  remarks?: string
}

export interface StockTransferFormDrawerProps {
  open: boolean
  onClose: () => void
}

const StockTransferFormDrawerInner: FC<StockTransferFormDrawerProps> = ({ open, onClose }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<TransferFormValues>()

  // Items added to the transfer, and the qty moved out of each of their lots:
  // { itemId: { lotKey: qty } }.
  const [movedItems, setMovedItems] = useState<string[]>([])
  const [qtyByItem, setQtyByItem] = useState<Record<string, Record<string, number>>>({})
  const [pendingItemId, setPendingItemId] = useState<string>()

  const { data: items, loadMore: loadMoreItems, hasMore: hasMoreItems } = useProcurementItems(false)
  const { data: locations } = useLocations()
  const { mutateAsync: createTransfer, isPending: creating } = useCreateStockTransfer()

  const fromLocationId = Form.useWatch('fromLocationId', form) as string | undefined
  const toLocationId = Form.useWatch('toLocationId', form) as string | undefined
  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }))
  const itemOptions = items
    .filter(i => !movedItems.includes(i.id))
    .map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  const handleClose = () => {
    form.resetFields()
    setMovedItems([])
    setQtyByItem({})
    setPendingItemId(undefined)
    onClose()
  }

  const handleAddItem = () => {
    if (!pendingItemId) return
    setMovedItems(prev => [...prev, pendingItemId])
    setPendingItemId(undefined)
  }

  const removeItem = (itemId: string) => {
    setMovedItems(prev => prev.filter(id => id !== itemId))
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
    const values = await form.validateFields()

    const lines = []
    for (const itemId of movedItems) {
      for (const [key, qty] of Object.entries(qtyByItem[itemId] ?? {})) {
        if (qty > 0) {
          const { batchNo, heatNo, serialNo } = parseLotKey(key)
          lines.push({ itemId, batchNo, heatNo, serialNo, qty, remarks: undefined })
        }
      }
    }

    if (lines.length === 0) {
      message.error('Enter a quantity to move from at least one batch')
      return
    }

    try {
      await createTransfer({
        transferDate: values.transferDate.format('YYYY-MM-DD'),
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        remarks: values.remarks,
        items: lines,
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
      <Form form={form} layout="vertical" initialValues={{ transferDate: dayjs() }}>
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
                  // Allocated quantities are keyed by the source lot they came
                  // from, so they can't carry over to a different source — they
                  // would be sent as the new location's batches.
                  onChange={() => setQtyByItem({})}
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
            Posting moves the stock in one step — there is no in-transit or approval stage. Every
            batch below moves to the same destination, since ERP-BE books one destination per
            transfer.
          </Typography.Text>
        </FormSection>

        <FormSection
          title="Items to Move"
          description="Pick an item to list every batch it holds at the source location, then enter how much of each to move."
        >
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={18} md={20}>
              <Select
                style={{ width: '100%' }}
                placeholder={
                  fromLocationId ? 'Select an item to move' : 'Select a source location first'
                }
                disabled={!fromLocationId}
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

          {movedItems.length === 0 ? (
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
                Add an item above to list its batches at the source location.
              </Typography.Text>
            </div>
          ) : (
            movedItems.map(itemId => {
              const item = items.find(i => i.id === itemId)
              return (
                <ItemLotAllocator
                  key={itemId}
                  itemId={itemId}
                  title={item ? `${item.code} — ${item.name}` : itemId}
                  locationId={fromLocationId}
                  stockLabel="Available Qty"
                  qtyLabel="Transfer Qty"
                  values={qtyByItem[itemId] ?? {}}
                  onChange={(key, qty) => setLotQty(itemId, key, qty)}
                  onRemove={() => removeItem(itemId)}
                  emptyText="This item holds no stock at the source location."
                />
              )
            })
          )}
        </FormSection>
      </Form>
    </FormDrawer>
  )
}

export const StockTransferFormDrawer = deferMount(StockTransferFormDrawerInner)

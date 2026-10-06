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
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useStockBalance } from '@/modules/inventory/hooks/useStockBalance'
import type { StockBalanceRow } from '@/modules/inventory/hooks/useStockBalance'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { DeliveryChallanItemPayload, DeliveryChallanItemStockPayload } from '@/types/api/sales'
import type { SalesOrderItem } from '@/types/sales'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import {
  useCreateDeliveryChallan,
  useSalesOrderDispatchedQtyByItem,
} from '../hooks/useDeliveryChallans'
import { useSalesOrder, useSalesOrders } from '../hooks/useSalesOrders'

function lotKey(
  row: Pick<StockBalanceRow, 'locationId' | 'batchNo' | 'heatNo' | 'serialNo'>,
): string {
  return `${row.locationId}|${row.batchNo}|${row.heatNo}|${row.serialNo}`
}

interface ChallanLine {
  key: string
  salesOrderItemId: string | null
  itemId: string
  itemLabel: string
  uomId: string | null
  rate: number
  discountPercent: number
  taxPercent: number
  itemRemark: string
  pendingQty: number | null
  qtyByLot: Record<string, number>
}

interface HeaderFormValues {
  partyId: string
  challanDate: dayjs.Dayjs
  vehicleNo?: string
  lrNo?: string
  lrDate?: dayjs.Dayjs
  transporterName?: string
  gstin?: string
  partyStateCode?: string
  remarks?: string
}

export interface DeliveryChallanFormDrawerProps {
  open: boolean
  onClose: () => void
  salesOrderId?: string
}

export const DeliveryChallanFormDrawer: FC<DeliveryChallanFormDrawerProps> = ({
  open,
  onClose,
  salesOrderId: salesOrderIdProp,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<HeaderFormValues>()

  const [salesOrderId, setSalesOrderId] = useState<string | undefined>(salesOrderIdProp)
  const [lines, setLines] = useState<ChallanLine[]>([])
  const [pendingItemId, setPendingItemId] = useState<string>()
  const [prevOpen, setPrevOpen] = useState(open)

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { data: confirmedOrders } = useSalesOrders({ status: 'CONFIRMED', perPage: 200 })
  const { data: selectedOrder } = useSalesOrder(salesOrderId)
  const { dispatchedByItemId } = useSalesOrderDispatchedQtyByItem(salesOrderId)
  const { mutateAsync: createChallan, isPending } = useCreateDeliveryChallan()

  const itemsById = useMemo(() => new Map(items.map(i => [i.id, i])), [items])

  // Re-adopt the prop every time the drawer opens — covers both opening
  // fresh from the list (no prop) and opening from a sales order's
  // "Create Delivery Challan" button (prop set). Set during render (the
  // React-recommended "adjusting state on prop change" pattern) rather than
  // an effect, since this is a permanently-mounted sibling, not a fresh
  // mount per open.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setSalesOrderId(salesOrderIdProp)
  }

  // A picked order pins the customer + its GST fields so they can't drift
  // apart from the order — the backend rejects a challan whose party doesn't
  // match the order it dispatches against.
  useEffect(() => {
    if (!selectedOrder) return
    form.setFieldsValue({
      partyId: selectedOrder.partyId,
      gstin: selectedOrder.gstin ?? undefined,
      partyStateCode: selectedOrder.partyStateCode ?? undefined,
    })
  }, [selectedOrder, form])

  const customerOptions = customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))
  const orderOptions = confirmedOrders.map(o => ({
    value: o.id,
    label: `${o.orderNumber} — ${o.partyName ?? o.partyId}`,
  }))
  const itemOptions = items
    .filter(i => !lines.some(l => l.salesOrderItemId === null && l.itemId === i.id))
    .map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  const pendingOrderItems = (selectedOrder?.items ?? [])
    .map(item => ({ item, pendingQty: item.qty - (dispatchedByItemId.get(item.id) ?? 0) }))
    .filter(({ pendingQty }) => pendingQty > 0.0001)
    .filter(({ item }) => !lines.some(l => l.salesOrderItemId === item.id))

  const handleOrderChange = (value: string | undefined) => {
    setSalesOrderId(value)
    setLines(prev => prev.filter(l => l.salesOrderItemId === null))
  }

  const handleAddOrderItem = (item: SalesOrderItem, pendingQty: number) => {
    setLines(prev => [
      ...prev,
      {
        key: `so-${item.id}`,
        salesOrderItemId: item.id,
        itemId: item.itemId,
        itemLabel: item.itemCode
          ? `${item.itemCode} — ${item.itemName}`
          : (item.itemName ?? item.itemId),
        uomId: item.uomId,
        rate: item.rate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        itemRemark: '',
        pendingQty,
        qtyByLot: {},
      },
    ])
  }

  const handleAddDirectItem = () => {
    if (!pendingItemId) return
    const item = itemsById.get(pendingItemId)
    if (!item) return
    setLines(prev => [
      ...prev,
      {
        key: `direct-${pendingItemId}-${prev.length}`,
        salesOrderItemId: null,
        itemId: pendingItemId,
        itemLabel: `${item.code} — ${item.name}`,
        uomId: item.uomId,
        rate: 0,
        discountPercent: 0,
        taxPercent: 0,
        itemRemark: '',
        pendingQty: null,
        qtyByLot: {},
      },
    ])
    setPendingItemId(undefined)
  }

  const updateLine = (key: string, patch: Partial<ChallanLine>) => {
    setLines(prev => prev.map(l => (l.key === key ? { ...l, ...patch } : l)))
  }

  const setLotQty = (key: string, lot: string, qty: number | null) => {
    setLines(prev =>
      prev.map(l => (l.key === key ? { ...l, qtyByLot: { ...l.qtyByLot, [lot]: qty ?? 0 } } : l)),
    )
  }

  const removeLine = (key: string) => setLines(prev => prev.filter(l => l.key !== key))

  const handleClose = () => {
    form.resetFields()
    setSalesOrderId(undefined)
    setLines([])
    setPendingItemId(undefined)
    onClose()
  }

  const handleSubmit = async () => {
    const header = await form.validateFields()

    const itemPayloads: DeliveryChallanItemPayload[] = []
    for (const line of lines) {
      const stocks: DeliveryChallanItemStockPayload[] = []
      for (const [key, qty] of Object.entries(line.qtyByLot)) {
        if (qty > 0) {
          const [locationId, batchNo, heatNo, serialNo] = key.split('|')
          stocks.push({
            location_id: Number(locationId),
            batch_no: batchNo,
            heat_no: heatNo,
            serial_no: serialNo,
            qty,
          })
        }
      }
      if (stocks.length === 0) continue
      itemPayloads.push({
        sales_order_item_id: line.salesOrderItemId ? Number(line.salesOrderItemId) : undefined,
        item_id: line.salesOrderItemId ? undefined : Number(line.itemId),
        uom_id: line.salesOrderItemId ? undefined : line.uomId ? Number(line.uomId) : undefined,
        rate: line.rate,
        discount_percent: line.discountPercent,
        tax_percent: line.taxPercent,
        item_remark: line.itemRemark || null,
        stocks,
      })
    }

    if (itemPayloads.length === 0) {
      message.error('Enter a dispatch quantity for at least one item')
      return
    }

    try {
      await createChallan({
        party_id: Number(header.partyId),
        party_state_code: header.partyStateCode || null,
        gstin: header.gstin || null,
        challan_date: header.challanDate.format('YYYY-MM-DD'),
        vehicle_no: header.vehicleNo || null,
        lr_no: header.lrNo || null,
        lr_date: header.lrDate ? header.lrDate.format('YYYY-MM-DD') : null,
        transporter_name: header.transporterName || null,
        remarks: header.remarks || null,
        items: itemPayloads,
      })
      message.success('Delivery challan created')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title="New Delivery Challan"
      open={open}
      width={1100}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      submitText="Save Delivery Challan"
    >
      <Form form={form} layout="vertical" initialValues={{ challanDate: dayjs() }}>
        <FormSection title="Challan Details">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Challan Date"
                name="challanDate"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={10}>
              <Form.Item
                label="Customer"
                name="partyId"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select
                  placeholder="Select customer"
                  options={customerOptions}
                  disabled={!!salesOrderId}
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
              <Form.Item label="Against Sales Order (optional)">
                <Select
                  placeholder="Dispatch against a confirmed order"
                  options={orderOptions}
                  value={salesOrderId}
                  onChange={handleOrderChange}
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
              <Form.Item label="Vehicle No" name="vehicleNo">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="LR No" name="lrNo">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="LR Date" name="lrDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Transporter Name" name="transporterName">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="GSTIN" name="gstin">
                <Input placeholder="Customer GSTIN" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="State Code" name="partyStateCode">
                <Input maxLength={2} placeholder="e.g. 24" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </FormSection>

        {selectedOrder && (
          <FormSection
            title="Pending Order Items"
            description={`From ${selectedOrder.orderNumber} — add a line, then pick which stock to dispatch it from below`}
          >
            <DataTable<{ item: SalesOrderItem; pendingQty: number }>
              columns={[
                {
                  title: 'Item',
                  key: 'item',
                  render: (_, r) =>
                    r.item.itemCode ? `${r.item.itemCode} — ${r.item.itemName}` : r.item.itemName,
                },
                { title: 'Order Qty', key: 'qty', width: 100, render: (_, r) => r.item.qty },
                {
                  title: 'Pending Qty',
                  key: 'pendingQty',
                  width: 110,
                  render: (_, r) => r.pendingQty,
                },
                {
                  title: '',
                  key: 'action',
                  width: 90,
                  render: (_, r) => (
                    <Button size="small" onClick={() => handleAddOrderItem(r.item, r.pendingQty)}>
                      Add
                    </Button>
                  ),
                },
              ]}
              dataSource={pendingOrderItems}
              rowKey={r => r.item.id}
              pagination={false}
              size="small"
              locale={{ emptyText: 'All items on this order are fully dispatched.' }}
            />
          </FormSection>
        )}

        <FormSection title="Direct Items">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Select
              style={{ flex: 1 }}
              placeholder="Select an item to dispatch directly (not tied to a sales order)"
              value={pendingItemId}
              onChange={setPendingItemId}
              options={itemOptions}
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            <Button icon={<PlusOutlined />} onClick={handleAddDirectItem} disabled={!pendingItemId}>
              Add Item
            </Button>
          </div>
        </FormSection>

        {lines.length === 0 && (
          <Typography.Text type="secondary">
            Add at least one item above to dispatch.
          </Typography.Text>
        )}

        {lines.map(line => (
          <ChallanLinePanel
            key={line.key}
            line={line}
            onUpdate={patch => updateLine(line.key, patch)}
            onLotQtyChange={(lot, qty) => setLotQty(line.key, lot, qty)}
            onRemove={() => removeLine(line.key)}
          />
        ))}
      </Form>
    </FormDrawer>
  )
}

interface ChallanLinePanelProps {
  line: ChallanLine
  onUpdate: (patch: Partial<ChallanLine>) => void
  onLotQtyChange: (lot: string, qty: number | null) => void
  onRemove: () => void
}

// Mirrors the stock-issue lot picker: show every real (location, batch, heat,
// serial) lot this item actually has stock in, with the available quantity
// right next to the input.
const ChallanLinePanel: FC<ChallanLinePanelProps> = ({
  line,
  onUpdate,
  onLotQtyChange,
  onRemove,
}) => {
  const { data: rows, isLoading } = useStockBalance(line.itemId)
  const { data: locations } = useLocations()
  const locationNameById = new Map(locations.map(l => [l.id, l.name]))
  const dispatchQty = Object.values(line.qtyByLot).reduce((sum, q) => sum + q, 0)

  const columns: TableColumnsType<StockBalanceRow> = [
    {
      title: 'Location',
      dataIndex: 'locationId',
      key: 'locationId',
      render: (locationId: string) => locationNameById.get(locationId) ?? locationId,
    },
    { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo' },
    { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo' },
    { title: 'Serial No', dataIndex: 'serialNo', key: 'serialNo' },
    { title: 'Available Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
    {
      title: 'Dispatch Qty',
      key: 'dispatchQty',
      render: (_, row) => {
        const key = lotKey(row)
        return (
          <InputNumber
            min={0}
            max={row.qty}
            value={line.qtyByLot[key] || undefined}
            onChange={v => onLotQtyChange(key, v)}
            style={{ width: '100%' }}
          />
        )
      },
    },
  ]

  return (
    <Card
      size="small"
      title={line.itemLabel}
      extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />}
      style={{ marginBottom: 12 }}
    >
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col xs={12} md={4}>
          <Typography.Text type="secondary">Rate</Typography.Text>
          <InputNumber
            min={0}
            value={line.rate}
            onChange={v => onUpdate({ rate: v ?? 0 })}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={12} md={4}>
          <Typography.Text type="secondary">Disc %</Typography.Text>
          <InputNumber
            min={0}
            max={100}
            value={line.discountPercent}
            onChange={v => onUpdate({ discountPercent: v ?? 0 })}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={12} md={4}>
          <Typography.Text type="secondary">Tax %</Typography.Text>
          <InputNumber
            min={0}
            value={line.taxPercent}
            onChange={v => onUpdate({ taxPercent: v ?? 0 })}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={12} md={6}>
          <Typography.Text type="secondary">
            Dispatch Qty{line.pendingQty != null ? ` (pending ${line.pendingQty})` : ''}
          </Typography.Text>
          <div>
            <Typography.Text strong>{dispatchQty}</Typography.Text>
          </div>
        </Col>
        <Col xs={24} md={6}>
          <Typography.Text type="secondary">Remark</Typography.Text>
          <Input value={line.itemRemark} onChange={e => onUpdate({ itemRemark: e.target.value })} />
        </Col>
      </Row>
      <DataTable<StockBalanceRow>
        columns={columns}
        dataSource={rows}
        rowKey={row => lotKey(row)}
        loading={isLoading}
        pagination={false}
        size="small"
        locale={{ emptyText: 'No stock available for this item.' }}
      />
    </Card>
  )
}

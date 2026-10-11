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
import { useMemo, useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useStockBalance } from '@/modules/inventory/hooks/useStockBalance'
import type { StockBalanceRow } from '@/modules/inventory/hooks/useStockBalance'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { SalesInvoiceItemPayload, SalesInvoiceItemStockPayload } from '@/types/api/sales'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import { useCreateSalesInvoice } from '../hooks/useSalesInvoices'

// Same lot identity as the delivery challan drawer: a stock row is unique by
// (location, batch, heat, serial).
function lotKey(
  row: Pick<StockBalanceRow, 'locationId' | 'batchNo' | 'heatNo' | 'serialNo'>,
): string {
  return `${row.locationId}|${row.batchNo}|${row.heatNo}|${row.serialNo}`
}

interface InvoiceLine {
  key: string
  itemId: string
  itemLabel: string
  uomId: string | null
  rate: number
  discountPercent: number
  taxPercent: number
  itemRemark: string
  qtyByLot: Record<string, number>
}

interface HeaderValues {
  partyId: string
  invoiceDate: dayjs.Dayjs
  gstin?: string
  partyStateCode?: string
  remarks?: string
}

export interface SalesInvoiceDirectFormDrawerProps {
  open: boolean
  onClose: () => void
}

export const SalesInvoiceDirectFormDrawer: FC<SalesInvoiceDirectFormDrawerProps> = ({
  open,
  onClose,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<HeaderValues>()
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [pendingItemId, setPendingItemId] = useState<string>()

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { mutateAsync: createInvoice, isPending } = useCreateSalesInvoice()

  const itemsById = useMemo(() => new Map(items.map(i => [i.id, i])), [items])

  const customerOptions = customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))
  const itemOptions = items
    .filter(i => !lines.some(l => l.itemId === i.id))
    .map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  const handleAddItem = () => {
    if (!pendingItemId) return
    const item = itemsById.get(pendingItemId)
    if (!item) return
    setLines(prev => [
      ...prev,
      {
        key: `${pendingItemId}-${prev.length}`,
        itemId: pendingItemId,
        itemLabel: `${item.code} — ${item.name}`,
        uomId: item.uomId,
        rate: 0,
        discountPercent: 0,
        taxPercent: 0,
        itemRemark: '',
        qtyByLot: {},
      },
    ])
    setPendingItemId(undefined)
  }

  const updateLine = (key: string, patch: Partial<InvoiceLine>) =>
    setLines(prev => prev.map(l => (l.key === key ? { ...l, ...patch } : l)))

  const setLotQty = (key: string, lot: string, qty: number | null) =>
    setLines(prev =>
      prev.map(l => (l.key === key ? { ...l, qtyByLot: { ...l.qtyByLot, [lot]: qty ?? 0 } } : l)),
    )

  const handleClose = () => {
    form.resetFields()
    setLines([])
    setPendingItemId(undefined)
    onClose()
  }

  const handleSubmit = async () => {
    const header = await form.validateFields()

    const itemPayloads: SalesInvoiceItemPayload[] = []
    for (const line of lines) {
      if (!line.uomId) {
        message.error(`${line.itemLabel} has no UOM on its item master`)
        return
      }
      const stocks: SalesInvoiceItemStockPayload[] = []
      for (const [key, qty] of Object.entries(line.qtyByLot)) {
        if (qty > 0) {
          const [locationId, batchNo, heatNo, serialNo] = key.split('|')
          stocks.push({
            location_id: Number(locationId),
            batch_no: batchNo || null,
            heat_no: heatNo || null,
            serial_no: serialNo || null,
            qty,
          })
        }
      }
      if (stocks.length === 0) continue
      itemPayloads.push({
        item_id: Number(line.itemId),
        uom_id: Number(line.uomId),
        rate: line.rate,
        discount_percent: line.discountPercent,
        tax_percent: line.taxPercent,
        item_remark: line.itemRemark || null,
        stocks,
      })
    }

    if (itemPayloads.length === 0) {
      message.error('Enter a quantity for at least one item')
      return
    }

    try {
      await createInvoice({
        party_id: Number(header.partyId),
        party_state_code: header.partyStateCode || null,
        gstin: header.gstin || null,
        invoice_date: header.invoiceDate.format('YYYY-MM-DD'),
        remarks: header.remarks || null,
        items: itemPayloads,
      })
      message.success('Sales invoice created')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title="New Sales Invoice — Direct"
      open={open}
      width={1100}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      submitText="Create Invoice"
    >
      <Form form={form} layout="vertical" initialValues={{ invoiceDate: dayjs() }}>
        <FormSection title="Invoice Details">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Invoice Date"
                name="invoiceDate"
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
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item label="GSTIN" name="gstin">
                <Input placeholder="Customer GSTIN" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item label="State Code" name="partyStateCode">
                <Input maxLength={2} placeholder="e.g. 24" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </FormSection>

        <FormSection title="Items">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Select
              style={{ flex: 1 }}
              placeholder="Select an item to invoice"
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
            <Button icon={<PlusOutlined />} onClick={handleAddItem} disabled={!pendingItemId}>
              Add Item
            </Button>
          </div>
        </FormSection>

        {lines.length === 0 && (
          <Typography.Text type="secondary">Add at least one item to invoice.</Typography.Text>
        )}

        {lines.map(line => (
          <InvoiceLinePanel
            key={line.key}
            line={line}
            onUpdate={patch => updateLine(line.key, patch)}
            onLotQtyChange={(lot, qty) => setLotQty(line.key, lot, qty)}
            onRemove={() => setLines(prev => prev.filter(l => l.key !== line.key))}
          />
        ))}
      </Form>
    </FormDrawer>
  )
}

interface InvoiceLinePanelProps {
  line: InvoiceLine
  onUpdate: (patch: Partial<InvoiceLine>) => void
  onLotQtyChange: (lot: string, qty: number | null) => void
  onRemove: () => void
}

const InvoiceLinePanel: FC<InvoiceLinePanelProps> = ({
  line,
  onUpdate,
  onLotQtyChange,
  onRemove,
}) => {
  const { data: rows, isLoading } = useStockBalance(line.itemId)
  const { data: locations } = useLocations()
  const locationNameById = new Map(locations.map(l => [l.id, l.name]))
  const qty = Object.values(line.qtyByLot).reduce((sum, q) => sum + q, 0)

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
      title: 'Invoice Qty',
      key: 'invoiceQty',
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
        <Col xs={12} md={4}>
          <Typography.Text type="secondary">Invoice Qty</Typography.Text>
          <div>
            <Typography.Text strong>{qty}</Typography.Text>
          </div>
        </Col>
        <Col xs={24} md={8}>
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

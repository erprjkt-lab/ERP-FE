import { App, DatePicker, Form, Input, InputNumber, Select, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import type { SalesInvoiceFromChallanItemPayload } from '@/types/api/sales'
import type { DeliveryChallanItemRow } from '@/types/sales'
import { useDeliveryChallanItems } from '../hooks/useDeliveryChallans'
import { useCreateSalesInvoiceFromChallan } from '../hooks/useSalesInvoices'

interface HeaderValues {
  invoiceDate: dayjs.Dayjs
  remarks?: string
}

/** What the user typed for one challan line, keyed by challan item id. */
interface LineEdit {
  qty: number
  rate?: number
  itemRemark?: string
}

export interface SalesInvoiceFromChallanDrawerProps {
  open: boolean
  onClose: () => void
}

export const SalesInvoiceFromChallanDrawer: FC<SalesInvoiceFromChallanDrawerProps> = ({
  open,
  onClose,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<HeaderValues>()
  const [partyId, setPartyId] = useState<string>()
  const [edits, setEdits] = useState<Record<string, LineEdit>>({})

  // The BE derives the invoice header (customer, GST) from the challan lines,
  // so this only needs the dispatched lines that still have something to bill.
  const { data: challanLines, isLoading } = useDeliveryChallanItems({
    status: 'DISPATCHED',
    perPage: 200,
  })
  const { mutateAsync: createInvoice, isPending } = useCreateSalesInvoiceFromChallan()

  const pendingLines = challanLines.filter(line => line.dispatchQty - line.billedQty > 0.0001)

  // One invoice belongs to one customer, so picking lines is scoped to a party.
  const partyOptions = Array.from(
    new Map(pendingLines.map(l => [l.partyId, l.partyName ?? l.partyId])).entries(),
  ).map(([value, label]) => ({ value, label }))

  const visibleLines = partyId ? pendingLines.filter(l => l.partyId === partyId) : []

  const setEdit = (id: string, patch: Partial<LineEdit>) =>
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] ?? { qty: 0 }), ...patch } }))

  const handleClose = () => {
    form.resetFields()
    setPartyId(undefined)
    setEdits({})
    onClose()
  }

  const handleSubmit = async () => {
    const header = await form.validateFields()

    const items: SalesInvoiceFromChallanItemPayload[] = visibleLines
      .filter(line => (edits[line.id]?.qty ?? 0) > 0)
      .map(line => ({
        delivery_challan_item_id: Number(line.id),
        qty: edits[line.id].qty,
        rate: edits[line.id].rate ?? null,
        item_remark: edits[line.id].itemRemark || null,
      }))

    if (items.length === 0) {
      message.error('Enter a billing quantity for at least one challan line')
      return
    }

    try {
      await createInvoice({
        invoice_date: header.invoiceDate.format('YYYY-MM-DD'),
        remarks: header.remarks || null,
        items,
      })
      message.success('Sales invoice created from delivery challan')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns: TableColumnsType<DeliveryChallanItemRow> = [
    { title: 'Challan #', dataIndex: 'challanNumber', key: 'challanNumber', width: 150 },
    { title: 'Date', dataIndex: 'challanDate', key: 'challanDate', width: 110 },
    {
      title: 'Item',
      key: 'item',
      render: (_, r) => (r.itemCode ? `${r.itemCode} — ${r.itemName}` : (r.itemName ?? r.itemId)),
    },
    { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
    {
      title: 'Pending Qty',
      key: 'pendingQty',
      width: 110,
      align: 'right',
      render: (_, r) => r.dispatchQty - r.billedQty,
    },
    {
      title: 'Bill Qty',
      key: 'qty',
      width: 120,
      render: (_, r) => (
        <InputNumber
          min={0}
          max={r.dispatchQty - r.billedQty}
          value={edits[r.id]?.qty || undefined}
          onChange={v => setEdit(r.id, { qty: v ?? 0 })}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Rate',
      key: 'rate',
      width: 120,
      render: (_, r) => (
        <InputNumber
          min={0}
          placeholder={String(r.rate)}
          value={edits[r.id]?.rate}
          onChange={v => setEdit(r.id, { rate: v ?? undefined })}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Remark',
      key: 'itemRemark',
      render: (_, r) => (
        <Input
          value={edits[r.id]?.itemRemark}
          onChange={e => setEdit(r.id, { itemRemark: e.target.value })}
        />
      ),
    },
  ]

  return (
    <FormDrawer
      title="New Sales Invoice — From Delivery Challan"
      open={open}
      width={1100}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      submitText="Create Invoice"
    >
      <Form form={form} layout="vertical" initialValues={{ invoiceDate: dayjs() }}>
        <FormSection title="Invoice Details">
          <div className="erp-form-grid">
            <Form.Item
              label="Invoice Date"
              name="invoiceDate"
              rules={[{ required: true, message: 'Required' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Customer" required>
              <Select
                placeholder="Pick the customer whose challans to bill"
                options={partyOptions}
                value={partyId}
                onChange={value => {
                  setPartyId(value)
                  setEdits({})
                }}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </div>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </FormSection>

        <FormSection
          title="Unbilled Challan Lines"
          description="Leave Rate blank to bill at the challan rate."
        >
          {!partyId ? (
            <Typography.Text type="secondary">
              Select a customer to list their unbilled delivery challan lines.
            </Typography.Text>
          ) : (
            <DataTable<DeliveryChallanItemRow>
              columns={columns}
              dataSource={visibleLines}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              size="small"
              locale={{ emptyText: 'No unbilled challan lines for this customer.' }}
            />
          )}
        </FormSection>
      </Form>
    </FormDrawer>
  )
}

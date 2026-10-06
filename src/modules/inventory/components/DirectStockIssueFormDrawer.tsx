import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  InputNumber,
  Row,
  Select,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useEmployees } from '@/modules/hr/hooks/useEmployees'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { DirectIssueLine } from '@/types/api/inventory'
import { useLocations } from '../hooks/useLocations'
import { useStockBalance, type StockBalanceRow } from '../hooks/useStockBalance'
import { useCreateDirectStockIssue } from '../hooks/useStockIssues'

interface ItemLine {
  itemId: string
  itemLabel: string
  qtyByLot: Record<string, number>
}

function lotKey(
  row: Pick<StockBalanceRow, 'locationId' | 'batchNo' | 'heatNo' | 'serialNo'>,
): string {
  return `${row.locationId}|${row.batchNo}|${row.heatNo}|${row.serialNo}`
}

export interface DirectStockIssueFormDrawerProps {
  open: boolean
  onClose: () => void
}

export const DirectStockIssueFormDrawer: FC<DirectStockIssueFormDrawerProps> = ({
  open,
  onClose,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<{ issuedTo: string; issueDate?: dayjs.Dayjs }>()
  const [itemLines, setItemLines] = useState<ItemLine[]>([])
  const [pendingItemId, setPendingItemId] = useState<string>()
  const { data: items } = useProcurementItems()
  const { data: employees } = useEmployees()
  const { mutateAsync: createDirectIssue, isPending } = useCreateDirectStockIssue()

  const itemOptions = items
    .filter(i => !itemLines.some(line => line.itemId === i.id))
    .map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))
  const employeeOptions = (employees ?? []).map(e => ({ label: e.fullName, value: e.id }))

  const handleClose = () => {
    form.resetFields()
    setItemLines([])
    setPendingItemId(undefined)
    onClose()
  }

  const handleAddItem = () => {
    if (!pendingItemId) return
    const item = items.find(i => i.id === pendingItemId)
    setItemLines(prev => [
      ...prev,
      {
        itemId: pendingItemId,
        itemLabel: item ? `${item.code} — ${item.name}` : pendingItemId,
        qtyByLot: {},
      },
    ])
    setPendingItemId(undefined)
  }

  const setLotQty = (itemId: string, key: string, qty: number | null) => {
    setItemLines(prev =>
      prev.map(line =>
        line.itemId === itemId
          ? { ...line, qtyByLot: { ...line.qtyByLot, [key]: qty ?? 0 } }
          : line,
      ),
    )
  }

  const handleSubmit = async () => {
    try {
      const header = await form.validateFields()
      const lines: DirectIssueLine[] = []
      for (const line of itemLines) {
        for (const [key, qty] of Object.entries(line.qtyByLot)) {
          if (qty > 0) {
            const [storeLocationId, batchNo, heatNo] = key.split('|')
            lines.push({
              item_id: Number(line.itemId),
              store_location_id: Number(storeLocationId),
              batch_no: batchNo,
              heat_no: heatNo,
              issued_qty: qty,
            })
          }
        }
      }
      if (lines.length === 0) {
        message.error('Enter a quantity to issue from at least one location/batch')
        return
      }
      await createDirectIssue({
        issued_to: Number(header.issuedTo),
        issue_date: header.issueDate ? header.issueDate.format('YYYY-MM-DD') : undefined,
        lines,
      })
      message.success('Stock issued successfully')
      handleClose()
    } catch (error) {
      if (error instanceof Error) message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title="Direct Stock Issue"
      open={open}
      width={900}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      submitText="Issue Stock"
    >
      <Form form={form} layout="vertical" initialValues={{ issueDate: dayjs() }}>
        <FormSection title="Issue Details">
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Issued To"
                name="issuedTo"
                rules={[{ required: true, message: 'Please select an employee' }]}
              >
                <Select
                  placeholder="Select employee"
                  options={employeeOptions}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Issue Date"
                name="issueDate"
                rules={[{ required: true, message: 'Issue date is required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <FormSection title="Items to Issue">
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={18} md={20}>
              <Select
                style={{ width: '100%' }}
                placeholder="Select an item to issue"
                value={pendingItemId}
                onChange={setPendingItemId}
                options={itemOptions}
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

          {itemLines.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 8,
                border: '1px dashed rgba(0, 0, 0, 0.15)',
              }}
            >
              <Typography.Text type="secondary">
                Select an item above and click &quot;Add Item&quot; to view available batches and
                allocate issue quantities.
              </Typography.Text>
            </div>
          ) : (
            itemLines.map(line => (
              <DirectIssueItemPanel
                key={line.itemId}
                itemId={line.itemId}
                itemLabel={line.itemLabel}
                qtyByLot={line.qtyByLot}
                onQtyChange={(key, qty) => setLotQty(line.itemId, key, qty)}
                onRemove={() => setItemLines(prev => prev.filter(l => l.itemId !== line.itemId))}
              />
            ))
          )}
        </FormSection>
      </Form>
    </FormDrawer>
  )
}

interface DirectIssueItemPanelProps {
  itemId: string
  itemLabel: string
  qtyByLot: Record<string, number>
  onQtyChange: (key: string, qty: number | null) => void
  onRemove: () => void
}

const DirectIssueItemPanel: FC<DirectIssueItemPanelProps> = ({
  itemId,
  itemLabel,
  qtyByLot,
  onQtyChange,
  onRemove,
}) => {
  const { data: rows, isLoading } = useStockBalance(itemId)
  const { data: locations } = useLocations()
  const locationNameById = new Map(locations.map(l => [l.id, l.name]))

  const columns: TableColumnsType<StockBalanceRow> = [
    {
      title: 'Location',
      dataIndex: 'locationId',
      key: 'locationId',
      render: (locationId: string) => locationNameById.get(locationId) ?? locationId,
    },
    { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo' },
    { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo' },
    { title: 'Available Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
    {
      title: 'Issue Qty',
      key: 'issueQty',
      width: 140,
      render: (_, row) => {
        const key = lotKey(row)
        return (
          <InputNumber
            min={0}
            max={row.qty}
            value={qtyByLot[key] || undefined}
            onChange={v => onQtyChange(key, v)}
            style={{ width: '100%' }}
            placeholder="0"
          />
        )
      },
    },
  ]

  return (
    <Card
      size="small"
      title={itemLabel}
      extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />}
      style={{ marginBottom: 16 }}
    >
      <DataTable<StockBalanceRow>
        columns={columns}
        dataSource={rows}
        rowKey={row => lotKey(row)}
        loading={isLoading}
        pagination={false}
        size="small"
        locale={{ emptyText: 'No stock available for this item across store locations.' }}
      />
    </Card>
  )
}

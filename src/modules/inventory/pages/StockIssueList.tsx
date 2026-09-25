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
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { useEmployees } from '@/modules/hr/hooks/useEmployees'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockIssue } from '@/types/inventory'
import { useLocations } from '../hooks/useLocations'
import { useStockBalance, type StockBalanceRow } from '../hooks/useStockBalance'
import { useAllStockIssues, useCreateDirectStockIssue } from '../hooks/useStockIssues'
import type { DirectIssueLine } from '@/types/api/inventory'

const getColumns = (): TableColumnsType<StockIssue> => [
  { title: 'Date', dataIndex: 'issueDate', key: 'issueDate', width: 120, render: v => v ?? '—' },
  {
    title: 'Source',
    dataIndex: 'source',
    key: 'source',
    width: 110,
    render: (v: StockIssue['source']) =>
      v === 'DIRECT' ? <Tag color="blue">Direct</Tag> : <Tag color="green">Requisition</Tag>,
  },
  { title: 'Item', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  {
    title: 'Location',
    dataIndex: 'storeLocationName',
    key: 'storeLocationName',
    render: v => v ?? '—',
  },
  {
    title: 'Batch / Heat',
    key: 'batchHeat',
    render: (_, r) => `${r.batchNo ?? '—'} / ${r.heatNo ?? '—'}`,
  },
  { title: 'Qty', dataIndex: 'issuedQty', key: 'issuedQty', align: 'right', width: 90 },
  { title: 'Issued By', dataIndex: 'issuedByName', key: 'issuedByName', render: v => v ?? '—' },
  { title: 'Issued To', dataIndex: 'issuedToName', key: 'issuedToName', render: v => v ?? '—' },
]

export const StockIssueList: FC = () => {
  const [itemId, setItemId] = useState<string | undefined>()
  const [locationId, setLocationId] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: items, isLoading: loadingItems } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: issues, isLoading } = useAllStockIssues({
    item_id: itemId ? Number(itemId) : undefined,
    location_id: locationId ? Number(locationId) : undefined,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Stock Issue"
        subtitle="Material issued from inventory — against a requisition or direct"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Issue' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Direct Issue
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              showSearch
              allowClear
              placeholder="Filter by item"
              style={{ width: '100%' }}
              loading={loadingItems}
              value={itemId}
              onChange={setItemId}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
              options={items.map(item => ({
                value: item.id,
                label: `${item.code} — ${item.name}`,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Filter by location"
              style={{ width: '100%' }}
              value={locationId}
              onChange={setLocationId}
              options={locations.map(l => ({ value: l.id, label: l.name }))}
            />
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<StockIssue>
          columns={getColumns()}
          dataSource={issues}
          rowKey="id"
          loading={isLoading}
          totalLabel="issues"
          fillHeight
        />
      </Card>

      {modalOpen && <DirectIssueModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}

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

const DirectIssueModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { message } = App.useApp()
  const [headerForm] = Form.useForm<{ issuedTo: string; issueDate?: dayjs.Dayjs }>()
  const [itemLines, setItemLines] = useState<ItemLine[]>([])
  const [pendingItemId, setPendingItemId] = useState<string>()
  const { data: items } = useProcurementItems()
  const { data: employees } = useEmployees()
  const { mutateAsync: createDirectIssue, isPending } = useCreateDirectStockIssue()

  const itemOptions = items
    .filter(i => !itemLines.some(line => line.itemId === i.id))
    .map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))
  const employeeOptions = (employees ?? []).map(e => ({ label: e.fullName, value: e.id }))

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
      const header = await headerForm.validateFields()
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
      message.success('Stock issued')
      onClose()
    } catch (error) {
      if (error instanceof Error) message.error(getErrorMessage(error))
    }
  }

  return (
    <Modal
      title="Direct Issue"
      open
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isPending}
      width={860}
      okText="Issue"
    >
      <Form form={headerForm} layout="vertical" initialValues={{ issueDate: dayjs() }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Issued To"
              name="issuedTo"
              rules={[{ required: true, message: 'Required' }]}
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
          <Col span={12}>
            <Form.Item label="Issue Date" name="issueDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Select
          style={{ flex: 1 }}
          placeholder="Select an item to issue"
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

      {itemLines.length === 0 && (
        <Typography.Text type="secondary">Add at least one item to issue.</Typography.Text>
      )}

      {itemLines.map(line => (
        <DirectIssueItemPanel
          key={line.itemId}
          itemId={line.itemId}
          itemLabel={line.itemLabel}
          qtyByLot={line.qtyByLot}
          onQtyChange={(key, qty) => setLotQty(line.itemId, key, qty)}
          onRemove={() => setItemLines(prev => prev.filter(l => l.itemId !== line.itemId))}
        />
      ))}
    </Modal>
  )
}

interface DirectIssueItemPanelProps {
  itemId: string
  itemLabel: string
  qtyByLot: Record<string, number>
  onQtyChange: (key: string, qty: number | null) => void
  onRemove: () => void
}

// Mirrors the job-card Issue Material picker: show every real (location,
// batch, heat) lot this item actually has stock in, with the available
// quantity right next to the input — instead of asking the user to type a
// location/batch/heat combination and hope it matches something real.
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
      render: (_, row) => {
        const key = lotKey(row)
        return (
          <InputNumber
            min={0}
            max={row.qty}
            value={qtyByLot[key] || undefined}
            onChange={v => onQtyChange(key, v)}
            style={{ width: '100%' }}
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
      style={{ marginBottom: 12 }}
    >
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

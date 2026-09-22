import { useState } from 'react'
import { Card, Col, DatePicker, Row, Select, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockLedgerEntry } from '@/types/inventory'
import { STOCK_MOVEMENT_TYPE_OPTIONS } from '../constants'
import { useLocations } from '../hooks/useLocations'
import { useStockLedger } from '../hooks/useStockLedger'

const getColumns = (): TableColumnsType<StockLedgerEntry> => [
  {
    title: 'Date',
    dataIndex: 'transactionDate',
    key: 'transactionDate',
    width: 160,
    render: (v?: string) => (v ? dayjs(v).format('DD-MMM-YYYY HH:mm') : '—'),
  },
  { title: 'Item', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  { title: 'Location', dataIndex: 'locationName', key: 'locationName', render: v => v ?? '—' },
  {
    title: 'Batch / Heat',
    key: 'batchHeat',
    render: (_, r) => `${r.batchNo ?? '—'} / ${r.heatNo ?? '—'}`,
  },
  {
    title: 'Transaction',
    dataIndex: 'transactionTypeLabel',
    key: 'transactionTypeLabel',
    render: v => v ?? '—',
  },
  {
    title: 'In/Out',
    dataIndex: 'inOut',
    key: 'inOut',
    width: 90,
    render: (v: number) => (v === 1 ? <Tag color="green">IN</Tag> : <Tag color="red">OUT</Tag>),
  },
  { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'right', width: 100 },
  {
    title: 'Rate',
    dataIndex: 'rate',
    key: 'rate',
    align: 'right',
    width: 100,
    render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
  },
]

export function StockLedger() {
  const [itemId, setItemId] = useState<string | undefined>()
  const [locationId, setLocationId] = useState<string | undefined>()
  const [transactionType, setTransactionType] = useState<number | undefined>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [page, setPage] = useState(1)

  const { data: items, isLoading: loadingItems } = useProcurementItems()
  const { data: locations } = useLocations()
  const {
    data: rows,
    meta,
    isLoading,
  } = useStockLedger({
    item_id: itemId ? Number(itemId) : undefined,
    location_id: locationId ? Number(locationId) : undefined,
    transaction_type: transactionType,
    from_date: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
    to_date: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
    page,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Stock Ledger"
        subtitle="Every stock movement, newest first"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Ledger' }]}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              showSearch
              allowClear
              placeholder="Item"
              style={{ width: '100%' }}
              loading={loadingItems}
              value={itemId}
              onChange={v => {
                setItemId(v)
                setPage(1)
              }}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
              options={items.map(item => ({
                value: item.id,
                label: `${item.code} — ${item.name}`,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              allowClear
              placeholder="Location"
              style={{ width: '100%' }}
              value={locationId}
              onChange={v => {
                setLocationId(v)
                setPage(1)
              }}
              options={locations.map(l => ({ value: l.id, label: l.name }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Transaction type"
              style={{ width: '100%' }}
              value={transactionType}
              onChange={v => {
                setTransactionType(v)
                setPage(1)
              }}
              options={STOCK_MOVEMENT_TYPE_OPTIONS}
            />
          </Col>
          <Col xs={24} sm={12} md={7}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={v => {
                setDateRange(v)
                setPage(1)
              }}
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
        <DataTable<StockLedgerEntry>
          columns={getColumns()}
          dataSource={rows}
          rowKey="id"
          loading={isLoading}
          fillHeight
          pagination={{
            current: meta?.current_page ?? page,
            pageSize: meta?.per_page ?? 20,
            total: meta?.total ?? 0,
            onChange: setPage,
          }}
        />
      </Card>
    </div>
  )
}

import { Alert, InputNumber, Table, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useStockBalance } from '@/modules/inventory/hooks/useStockBalance'
import type { StockLineInput } from '../hooks/useDeliveryChallans'

interface StockAllocatorProps {
  itemId?: string
  value: StockLineInput[]
  onChange: (stocks: StockLineInput[]) => void
}

interface Row {
  key: string
  locationId: string
  locationName: string
  batchNo: string
  heatNo: string
  serialNo: string
  available: number
  allocated: number
}

function keyOf(locationId: string, batchNo: string, heatNo: string, serialNo: string) {
  return [locationId, batchNo, heatNo, serialNo].join('|')
}

/** Dispatch and invoice quantities are the sum of what's allocated here rather
 * than a separately typed number — the backend derives the line qty from these
 * stock rows, and they must reference batches that actually exist. */
export const StockAllocator: FC<StockAllocatorProps> = ({ itemId, value, onChange }) => {
  const { data: balances, isLoading } = useStockBalance(itemId)
  const { data: locations } = useLocations()
  const locationNameById = new Map(locations.map(location => [location.id, location.name]))

  const allocatedFor = (row: Omit<Row, 'key' | 'allocated' | 'available' | 'locationName'>) =>
    value.find(
      stock =>
        stock.locationId === row.locationId &&
        (stock.batchNo ?? '') === row.batchNo &&
        (stock.heatNo ?? '') === row.heatNo &&
        (stock.serialNo ?? '') === row.serialNo,
    )?.qty ?? 0

  const rows: Row[] = balances
    .filter(balance => balance.qty > 0)
    .map(balance => ({
      key: keyOf(balance.locationId, balance.batchNo, balance.heatNo, balance.serialNo),
      locationId: balance.locationId,
      locationName: locationNameById.get(balance.locationId) ?? balance.locationId,
      batchNo: balance.batchNo,
      heatNo: balance.heatNo,
      serialNo: balance.serialNo,
      available: balance.qty,
      allocated: allocatedFor(balance),
    }))

  const setAllocation = (row: Row, qty: number) => {
    const others = value.filter(
      stock =>
        !(
          stock.locationId === row.locationId &&
          (stock.batchNo ?? '') === row.batchNo &&
          (stock.heatNo ?? '') === row.heatNo &&
          (stock.serialNo ?? '') === row.serialNo
        ),
    )
    onChange(
      qty > 0
        ? [
            ...others,
            {
              locationId: row.locationId,
              batchNo: row.batchNo || null,
              heatNo: row.heatNo || null,
              serialNo: row.serialNo || null,
              qty,
            },
          ]
        : others,
    )
  }

  const columns: TableColumnsType<Row> = [
    { title: 'Location', dataIndex: 'locationName', key: 'locationName', width: 110 },
    { title: 'Batch', dataIndex: 'batchNo', key: 'batchNo', render: v => v || '—' },
    { title: 'Heat', dataIndex: 'heatNo', key: 'heatNo', render: v => v || '—' },
    { title: 'Serial', dataIndex: 'serialNo', key: 'serialNo', render: v => v || '—' },
    { title: 'Available', dataIndex: 'available', key: 'available', width: 100 },
    {
      title: 'Dispatch Qty',
      key: 'allocated',
      width: 130,
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          max={row.available}
          value={row.allocated || undefined}
          style={{ width: '100%' }}
          onChange={qty => setAllocation(row, qty ?? 0)}
        />
      ),
    },
  ]

  const total = value.reduce((sum, stock) => sum + stock.qty, 0)

  if (!itemId) {
    return (
      <Typography.Text type="secondary">Select an item to see available stock.</Typography.Text>
    )
  }

  if (!isLoading && rows.length === 0) {
    return <Alert type="warning" showIcon message="No stock available for this item." />
  }

  return (
    <div>
      <Table<Row>
        columns={columns}
        dataSource={rows}
        rowKey="key"
        loading={isLoading}
        pagination={false}
        size="small"
      />
      <Typography.Text strong style={{ display: 'block', marginTop: 8 }}>
        Total allocated: {total}
      </Typography.Text>
    </div>
  )
}

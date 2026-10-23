import { DeleteOutlined } from '@ant-design/icons'
import { Button, Card, InputNumber } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC, ReactNode } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { useLocations } from '../hooks/useLocations'
import { useStockBalance, type StockBalanceRow } from '../hooks/useStockBalance'

/** ASCII unit separator. Batch/heat/serial are 100-char free text, so any
 *  printable delimiter could turn up inside one and split the key in the wrong
 *  place — this can't be typed into an input. Keys are internal: never displayed
 *  and never sent to ERP-BE, only round-tripped through parseLotKey. */
const SEP = '\u001f'

/** ERP-BE books stock against a location/batch/heat/serial lot, never against
 *  the item as a whole, so every screen that moves or counts stock allocates
 *  per lot and keys its entries this way. */
export function lotKey(
  row: Pick<StockBalanceRow, 'locationId' | 'batchNo' | 'heatNo' | 'serialNo'>,
): string {
  return [row.locationId, row.batchNo, row.heatNo, row.serialNo].join(SEP)
}

export function parseLotKey(key: string): {
  locationId: string
  batchNo: string
  heatNo: string
  serialNo: string
} {
  const [locationId, batchNo, heatNo, serialNo] = key.split(SEP)
  return { locationId, batchNo, heatNo, serialNo }
}

export interface ItemLotAllocatorProps {
  itemId: string
  title: ReactNode
  /** Scope to one store and drop the Location column — adjustments and
   *  transfers work within a single location. Leave unset to allocate across
   *  every location holding the item. */
  locationId?: string
  /** Header of the read-only stock column. */
  stockLabel?: string
  /** Header of the editable column. */
  qtyLabel?: string
  /** Stop the input at the lot's stock qty. Wrong for a physical count, which
   *  may legitimately find more than the system believes is there. */
  capAtStock?: boolean
  values: Record<string, number>
  onChange: (key: string, qty: number | null) => void
  onRemove?: () => void
  extra?: ReactNode
  emptyText?: string
}

/** One item's stock, lot by lot, with a number to fill in against each. */
export const ItemLotAllocator: FC<ItemLotAllocatorProps> = ({
  itemId,
  title,
  locationId,
  stockLabel = 'Available Qty',
  qtyLabel = 'Qty',
  capAtStock = true,
  values,
  onChange,
  onRemove,
  extra,
  emptyText,
}) => {
  const { data: rows, isLoading } = useStockBalance(itemId)
  const { data: locations } = useLocations()
  const locationNameById = new Map(locations.map(l => [l.id, l.name]))

  const lots = locationId ? rows.filter(row => row.locationId === locationId) : rows

  const columns: TableColumnsType<StockBalanceRow> = [
    // Shown even when the list is scoped to one location — the name comes from
    // the cached ['locations'] query the parent screens already load, so it
    // costs no extra request.
    {
      title: 'Location',
      dataIndex: 'locationId',
      key: 'locationId',
      render: (id: string) => locationNameById.get(id) ?? id,
    },
    { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo' },
    { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo' },
    { title: stockLabel, dataIndex: 'qty', key: 'qty', align: 'right' },
    {
      title: qtyLabel,
      key: 'input',
      width: 150,
      render: (_, row) => {
        const key = lotKey(row)
        return (
          <InputNumber
            min={0}
            max={capAtStock ? row.qty : undefined}
            value={values[key]}
            onChange={v => onChange(key, v)}
            style={{ width: '100%' }}
            placeholder={String(row.qty)}
          />
        )
      },
    },
  ]

  return (
    <Card
      size="small"
      title={title}
      extra={
        extra ??
        (onRemove && <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />)
      }
      style={{ marginBottom: 16 }}
    >
      <DataTable<StockBalanceRow>
        columns={columns}
        dataSource={lots}
        rowKey={row => lotKey(row)}
        loading={isLoading}
        pagination={false}
        size="small"
        locale={{
          emptyText:
            emptyText ??
            (locationId
              ? 'This item holds no stock at the selected location.'
              : 'No stock available for this item across store locations.'),
        }}
      />
    </Card>
  )
}

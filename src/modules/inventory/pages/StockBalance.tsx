import { useMemo, useState } from 'react'
import { Card, Select } from 'antd'
import type { TableColumnsType } from 'antd'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { useLocations } from '../hooks/useLocations'
import { useStockBalance, type StockBalanceRow } from '../hooks/useStockBalance'

function getColumns(locationNameById: Map<string, string>): TableColumnsType<StockBalanceRow> {
  return [
    {
      title: 'Location',
      dataIndex: 'locationId',
      key: 'locationId',
      render: (locationId: string) => locationNameById.get(locationId) ?? locationId,
    },
    { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo' },
    { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo' },
    { title: 'Serial No', dataIndex: 'serialNo', key: 'serialNo' },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
    {
      title: 'Avg Rate',
      dataIndex: 'avgRate',
      key: 'avgRate',
      align: 'right',
      render: (rate: number | null) => (rate != null ? rate.toFixed(2) : '—'),
    },
  ]
}

export function StockBalance() {
  const [itemId, setItemId] = useState<string | undefined>(undefined)
  const { data: items, isLoading: loadingItems } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: rows, isLoading: loadingBalance } = useStockBalance(itemId)

  const locationNameById = useMemo(() => new Map(locations.map(l => [l.id, l.name])), [locations])

  return (
    <>
      <PageHeader
        title="Stock Balance"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Balance' }]}
      />
      <Card>
        <Select
          showSearch
          allowClear
          placeholder="Select an item to view stock balance"
          style={{ width: 360, marginBottom: 16 }}
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
        <DataTable<StockBalanceRow>
          columns={getColumns(locationNameById)}
          dataSource={rows}
          rowKey={row => `${row.locationId}-${row.batchNo}-${row.heatNo}-${row.serialNo}`}
          loading={loadingBalance}
          pagination={false}
          locale={{
            emptyText: itemId
              ? 'No stock found for this item.'
              : 'Select an item to view stock balance.',
          }}
        />
      </Card>
    </>
  )
}

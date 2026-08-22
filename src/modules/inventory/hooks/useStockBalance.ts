import { useQuery } from '@tanstack/react-query'
import { getStockBalance } from '@/api/stock'
import type { ApiItemStockBalance } from '@/types/api/masters'

export interface StockBalanceRow {
  itemId: string
  locationId: string
  batchNo: string
  heatNo: string
  serialNo: string
  qty: number
  avgRate: number | null
}

function toRow(api: ApiItemStockBalance): StockBalanceRow {
  return {
    itemId: String(api.item_id),
    locationId: String(api.location_id),
    batchNo: api.batch_no,
    heatNo: api.heat_no,
    serialNo: api.serial_no,
    qty: Number(api.qty),
    avgRate: api.avg_rate != null ? Number(api.avg_rate) : null,
  }
}

export function useStockBalance(itemId: string | undefined) {
  const query = useQuery({
    queryKey: ['stock-balance', itemId],
    queryFn: async () => (await getStockBalance({ item_id: Number(itemId) })).data,
    enabled: !!itemId,
  })
  const rows = Array.isArray(query.data) ? query.data : []
  return { data: rows.map(toRow), isLoading: query.isLoading }
}

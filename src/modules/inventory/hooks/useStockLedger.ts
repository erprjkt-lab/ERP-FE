import { useQuery } from '@tanstack/react-query'
import { getStockLedger } from '@/api/stock'
import type { ApiStockMovement, StockLedgerFilters } from '@/types/api/inventory'
import type { StockLedgerEntry } from '@/types/inventory'

function toEntry(api: ApiStockMovement): StockLedgerEntry {
  return {
    id: String(api.id),
    itemId: String(api.item_id),
    itemName: api.item?.item_name,
    locationId: String(api.location_id),
    locationName: api.location?.name,
    batchNo: api.batch_no ?? undefined,
    heatNo: api.heat_no ?? undefined,
    serialNo: api.serial_no ?? undefined,
    transactionType: api.transaction_type,
    transactionTypeLabel: api.transaction_type_label ?? undefined,
    transactionDate: api.transaction_date ?? undefined,
    quantity: Number(api.quantity),
    inOut: api.in_out,
    rate: api.rate != null ? Number(api.rate) : null,
  }
}

export function useStockLedger(filters: StockLedgerFilters) {
  const query = useQuery({
    queryKey: ['stock-ledger', filters],
    queryFn: () => getStockLedger(filters),
  })
  return {
    data: (query.data?.data ?? []).map(toEntry),
    meta: query.data?.meta,
    isLoading: query.isLoading,
  }
}

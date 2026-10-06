import { apiRequest } from '@/api/client'
import type { PaginatedEnvelope } from '@/types/api'
import type { ApiEnvelope } from '@/types/api'
import type { ApiStockMovement, StockLedgerFilters } from '@/types/api/inventory'
import type { ApiItemStockBalance } from '@/types/api/masters'

export interface StockBalanceQuery {
  item_id: number
  location_id?: number
  batch_no?: string
  heat_no?: string
}

export function getStockBalance(
  params: StockBalanceQuery,
): Promise<ApiEnvelope<{ balance: string } | ApiItemStockBalance[]>> {
  return apiRequest('/api/v1/stock/balance', { query: { ...params } })
}

export function getStockLedger(
  filters: StockLedgerFilters = {},
): Promise<PaginatedEnvelope<ApiStockMovement>> {
  return apiRequest('/api/v1/stock/ledger', { query: { per_page: 20, ...filters } })
}

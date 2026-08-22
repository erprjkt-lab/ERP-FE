import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
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

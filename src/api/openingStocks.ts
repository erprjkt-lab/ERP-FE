import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiOpeningStock, CreateOpeningStockPayload } from '@/types/api/inventory'

export function listOpeningStocks(): Promise<PaginatedEnvelope<ApiOpeningStock>> {
  return apiRequest('/api/v1/opening-stocks', { query: { per_page: 100 } })
}

export function getOpeningStock(id: number): Promise<ApiEnvelope<ApiOpeningStock>> {
  return apiRequest(`/api/v1/opening-stocks/${id}`)
}

export function createOpeningStock(
  payload: CreateOpeningStockPayload,
): Promise<ApiEnvelope<ApiOpeningStock>> {
  return apiRequest('/api/v1/opening-stocks', { method: 'POST', body: payload })
}

// Reverses the stock this entry posted; ERP-BE refuses when any of it has since
// been consumed, so the whole entry is kept intact rather than half-undone.
export function deleteOpeningStock(id: number): Promise<void> {
  return apiRequest(`/api/v1/opening-stocks/${id}`, { method: 'DELETE' })
}

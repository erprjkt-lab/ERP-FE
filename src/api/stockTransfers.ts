import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiStockTransfer, CreateStockTransferPayload } from '@/types/api/inventory'

export function listStockTransfers(): Promise<PaginatedEnvelope<ApiStockTransfer>> {
  return apiRequest('/api/v1/stock-transfers', { query: { per_page: 100 } })
}

export function getStockTransfer(id: number): Promise<ApiEnvelope<ApiStockTransfer>> {
  return apiRequest(`/api/v1/stock-transfers/${id}`)
}

export function createStockTransfer(
  payload: CreateStockTransferPayload,
): Promise<ApiEnvelope<ApiStockTransfer>> {
  return apiRequest('/api/v1/stock-transfers', { method: 'POST', body: payload })
}

// Reverses both legs (OUT of the source, IN to the destination) in one go.
export function deleteStockTransfer(id: number): Promise<void> {
  return apiRequest(`/api/v1/stock-transfers/${id}`, { method: 'DELETE' })
}

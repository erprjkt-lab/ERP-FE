import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiStockAdjustment, CreateStockAdjustmentPayload } from '@/types/api/inventory'

/** Mirrors StockAdjustmentController::index()'s filters. No `search` there, so the
 *  adjustment-number match stays client-side. */
export interface StockAdjustmentListParams {
  status?: string | null
  locationId?: string | null
  fromDate?: string | null
  toDate?: string | null
}

export function listStockAdjustments(
  params: StockAdjustmentListParams = {},
): Promise<PaginatedEnvelope<ApiStockAdjustment>> {
  return apiRequest('/api/v1/stock-adjustments', {
    query: {
      per_page: 100,
      ...(params.status ? { status: params.status } : {}),
      ...(params.locationId ? { location_id: params.locationId } : {}),
      ...(params.fromDate ? { from_date: params.fromDate } : {}),
      ...(params.toDate ? { to_date: params.toDate } : {}),
    },
  })
}

export function getStockAdjustment(id: number): Promise<ApiEnvelope<ApiStockAdjustment>> {
  return apiRequest(`/api/v1/stock-adjustments/${id}`)
}

export function createStockAdjustment(
  payload: CreateStockAdjustmentPayload,
): Promise<ApiEnvelope<ApiStockAdjustment>> {
  return apiRequest('/api/v1/stock-adjustments', { method: 'POST', body: payload })
}

export function deleteStockAdjustment(id: number): Promise<void> {
  return apiRequest(`/api/v1/stock-adjustments/${id}`, { method: 'DELETE' })
}

export function approveStockAdjustment(id: number): Promise<ApiEnvelope<ApiStockAdjustment>> {
  return apiRequest(`/api/v1/stock-adjustments/${id}/approve`, { method: 'POST' })
}

export function updateStockAdjustment(
  id: number,
  payload: Partial<CreateStockAdjustmentPayload>,
): Promise<ApiEnvelope<ApiStockAdjustment>> {
  return apiRequest(`/api/v1/stock-adjustments/${id}`, { method: 'PUT', body: payload })
}

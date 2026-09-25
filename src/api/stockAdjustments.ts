import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiStockAdjustment, CreateStockAdjustmentPayload } from '@/types/api/inventory'

export function listStockAdjustments(): Promise<PaginatedEnvelope<ApiStockAdjustment>> {
  return apiRequest('/api/v1/stock-adjustments', { query: { per_page: 100 } })
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

export function cancelStockAdjustment(
  id: number,
  remarks?: string,
): Promise<ApiEnvelope<ApiStockAdjustment>> {
  return apiRequest(`/api/v1/stock-adjustments/${id}/cancel`, {
    method: 'POST',
    body: { remarks },
  })
}

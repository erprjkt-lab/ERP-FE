import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiStockRequisition,
  CreateStockRequisitionPayload,
  UpdateStockRequisitionPayload,
} from '@/types/api/inventory'

export function listStockRequisitions(): Promise<PaginatedEnvelope<ApiStockRequisition>> {
  return apiRequest('/api/v1/stock-requisitions', { query: { per_page: 100 } })
}

export function getStockRequisition(id: number): Promise<ApiEnvelope<ApiStockRequisition>> {
  return apiRequest(`/api/v1/stock-requisitions/${id}`)
}

export function createStockRequisition(
  payload: CreateStockRequisitionPayload,
): Promise<ApiEnvelope<ApiStockRequisition>> {
  return apiRequest('/api/v1/stock-requisitions', { method: 'POST', body: payload })
}

export function updateStockRequisition(
  id: number,
  payload: UpdateStockRequisitionPayload,
): Promise<ApiEnvelope<ApiStockRequisition>> {
  return apiRequest(`/api/v1/stock-requisitions/${id}`, { method: 'PUT', body: payload })
}

export function deleteStockRequisition(id: number): Promise<void> {
  return apiRequest(`/api/v1/stock-requisitions/${id}`, { method: 'DELETE' })
}

export function submitStockRequisition(id: number): Promise<ApiEnvelope<ApiStockRequisition>> {
  return apiRequest(`/api/v1/stock-requisitions/${id}/submit`, { method: 'POST' })
}

export function approveStockRequisition(id: number): Promise<ApiEnvelope<ApiStockRequisition>> {
  return apiRequest(`/api/v1/stock-requisitions/${id}/approve`, { method: 'POST' })
}

export function rejectStockRequisition(
  id: number,
  remarks?: string,
): Promise<ApiEnvelope<ApiStockRequisition>> {
  return apiRequest(`/api/v1/stock-requisitions/${id}/reject`, {
    method: 'POST',
    body: { remarks },
  })
}

export function closeStockRequisition(id: number): Promise<ApiEnvelope<ApiStockRequisition>> {
  return apiRequest(`/api/v1/stock-requisitions/${id}/close`, { method: 'POST' })
}

export function cancelStockRequisition(
  id: number,
  remarks?: string,
): Promise<ApiEnvelope<ApiStockRequisition>> {
  return apiRequest(`/api/v1/stock-requisitions/${id}/cancel`, {
    method: 'POST',
    body: { remarks },
  })
}

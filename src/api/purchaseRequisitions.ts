import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiPurchaseRequisition,
  CreatePurchaseRequisitionPayload,
  UpdatePurchaseRequisitionPayload,
} from '@/types/api/procurement'

export function listPurchaseRequisitions(): Promise<PaginatedEnvelope<ApiPurchaseRequisition>> {
  return apiRequest('/api/v1/purchase-requisitions', { query: { per_page: 100 } })
}

export function getPurchaseRequisition(id: number): Promise<ApiEnvelope<ApiPurchaseRequisition>> {
  return apiRequest(`/api/v1/purchase-requisitions/${id}`)
}

export function createPurchaseRequisition(
  payload: CreatePurchaseRequisitionPayload,
): Promise<ApiEnvelope<ApiPurchaseRequisition>> {
  return apiRequest('/api/v1/purchase-requisitions', { method: 'POST', body: payload })
}

export function updatePurchaseRequisition(
  id: number,
  payload: UpdatePurchaseRequisitionPayload,
): Promise<ApiEnvelope<ApiPurchaseRequisition>> {
  return apiRequest(`/api/v1/purchase-requisitions/${id}`, { method: 'PUT', body: payload })
}

export function deletePurchaseRequisition(id: number): Promise<void> {
  return apiRequest(`/api/v1/purchase-requisitions/${id}`, { method: 'DELETE' })
}

export function submitPurchaseRequisition(
  id: number,
): Promise<ApiEnvelope<ApiPurchaseRequisition>> {
  return apiRequest(`/api/v1/purchase-requisitions/${id}/submit`, { method: 'POST' })
}

export function approvePurchaseRequisition(
  id: number,
): Promise<ApiEnvelope<ApiPurchaseRequisition>> {
  return apiRequest(`/api/v1/purchase-requisitions/${id}/approve`, { method: 'POST' })
}

export function rejectPurchaseRequisition(
  id: number,
  remarks?: string,
): Promise<ApiEnvelope<ApiPurchaseRequisition>> {
  return apiRequest(`/api/v1/purchase-requisitions/${id}/reject`, {
    method: 'POST',
    body: { remarks },
  })
}

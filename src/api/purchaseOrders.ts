import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiPurchaseOrder,
  PurchaseOrderPayload,
  PurchaseOrderUpdatePayload,
} from '@/types/api/procurement'

export function listPurchaseOrders(): Promise<PaginatedEnvelope<ApiPurchaseOrder>> {
  return apiRequest('/api/v1/purchase-orders', { query: { per_page: 100 } })
}

export function getPurchaseOrder(id: number): Promise<ApiEnvelope<ApiPurchaseOrder>> {
  return apiRequest(`/api/v1/purchase-orders/${id}`)
}

export function createPurchaseOrder(
  payload: PurchaseOrderPayload,
): Promise<ApiEnvelope<ApiPurchaseOrder>> {
  return apiRequest('/api/v1/purchase-orders', { method: 'POST', body: payload })
}

export function updatePurchaseOrder(
  id: number,
  payload: PurchaseOrderUpdatePayload,
): Promise<ApiEnvelope<ApiPurchaseOrder>> {
  return apiRequest(`/api/v1/purchase-orders/${id}`, { method: 'PUT', body: payload })
}

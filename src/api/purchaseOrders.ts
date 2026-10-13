import { apiRequest } from '@/api/client'
import type { ApiEnvelope, ItemListParams, PaginatedEnvelope } from '@/types/api'
import type {
  ApiPurchaseOrder,
  ApiPurchaseOrderItemRow,
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

// Flat one-row-per-PO-line listing (joined with PO, supplier, item and UOM).
export function listPurchaseOrderItems(
  params: ItemListParams = {},
): Promise<PaginatedEnvelope<ApiPurchaseOrderItemRow>> {
  return apiRequest('/api/v1/purchase-order-items', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
    },
  })
}

export function approvePurchaseOrder(id: number): Promise<ApiEnvelope<ApiPurchaseOrder>> {
  return apiRequest(`/api/v1/purchase-orders/${id}/approve`, { method: 'POST' })
}

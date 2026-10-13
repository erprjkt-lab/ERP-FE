import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiStockRequisition,
  CreateStockRequisitionPayload,
  UpdateStockRequisitionPayload,
} from '@/types/api/inventory'

/** Mirrors the filters StockRequisitionController::index() reads off the request.
 *  ERP-BE has no `search` on this endpoint, so the list page still matches the
 *  requisition number client-side. */
export interface StockRequisitionListParams {
  status?: string | null
  departmentId?: string | null
  fromDate?: string | null
  toDate?: string | null
}

export function listStockRequisitions(
  params: StockRequisitionListParams = {},
): Promise<PaginatedEnvelope<ApiStockRequisition>> {
  return apiRequest('/api/v1/stock-requisitions', {
    query: {
      per_page: 100,
      ...(params.status ? { status: params.status } : {}),
      ...(params.departmentId ? { department_id: params.departmentId } : {}),
      ...(params.fromDate ? { from_date: params.fromDate } : {}),
      ...(params.toDate ? { to_date: params.toDate } : {}),
    },
  })
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

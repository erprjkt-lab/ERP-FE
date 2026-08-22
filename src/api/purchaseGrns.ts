import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiGrn, ApiGrnItem, GrnPayload, QcResultPayload } from '@/types/api/procurement'

export interface ListGrnsQuery {
  status?: number
  supplier_id?: number
  from_date?: string
  to_date?: string
}

export function listGrns(query: ListGrnsQuery = {}): Promise<PaginatedEnvelope<ApiGrn>> {
  return apiRequest('/api/v1/grn', { query: { ...query, per_page: 100 } })
}

export function getGrn(id: number): Promise<ApiEnvelope<ApiGrn>> {
  return apiRequest(`/api/v1/grn/${id}`)
}

export function createGrn(payload: GrnPayload): Promise<ApiEnvelope<ApiGrn>> {
  return apiRequest('/api/v1/grn', { method: 'POST', body: payload })
}

export function cancelGrn(id: number): Promise<ApiEnvelope<ApiGrn>> {
  return apiRequest(`/api/v1/grn/${id}/cancel`, { method: 'POST' })
}

export function saveGrnItemQc(
  grnItemId: number,
  payload: QcResultPayload,
): Promise<ApiEnvelope<ApiGrnItem>> {
  return apiRequest(`/api/v1/grn-items/${grnItemId}/qc`, { method: 'PATCH', body: payload })
}

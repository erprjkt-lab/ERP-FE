import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiHsnCode, CreateHsnCodePayload, UpdateHsnCodePayload } from '@/types/api/masters'

export function listHsnCodes(): Promise<PaginatedEnvelope<ApiHsnCode>> {
  return apiRequest('/api/v1/hsn-codes', { query: { per_page: 200 } })
}

export function getHsnCode(id: number): Promise<ApiEnvelope<ApiHsnCode>> {
  return apiRequest(`/api/v1/hsn-codes/${id}`)
}

export function createHsnCode(payload: CreateHsnCodePayload): Promise<ApiEnvelope<ApiHsnCode>> {
  return apiRequest('/api/v1/hsn-codes', { method: 'POST', body: payload })
}

export function updateHsnCode(
  id: number,
  payload: UpdateHsnCodePayload,
): Promise<ApiEnvelope<ApiHsnCode>> {
  return apiRequest(`/api/v1/hsn-codes/${id}`, { method: 'PUT', body: payload })
}

export function deleteHsnCode(id: number): Promise<void> {
  return apiRequest(`/api/v1/hsn-codes/${id}`, { method: 'DELETE' })
}

import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiParty, CreatePartyPayload, UpdatePartyPayload } from '@/types/api/masters'

export function listSuppliers(page = 1): Promise<PaginatedEnvelope<ApiParty>> {
  return apiRequest('/api/v1/suppliers', { query: { page, per_page: 100 } })
}

export function getSupplier(id: number): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest(`/api/v1/suppliers/${id}`)
}

export function createSupplier(payload: CreatePartyPayload): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest('/api/v1/suppliers', { method: 'POST', body: payload })
}

export function updateSupplier(
  id: number,
  payload: UpdatePartyPayload,
): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest(`/api/v1/suppliers/${id}`, { method: 'PUT', body: payload })
}

export function deleteSupplier(id: number): Promise<void> {
  return apiRequest(`/api/v1/suppliers/${id}`, { method: 'DELETE' })
}

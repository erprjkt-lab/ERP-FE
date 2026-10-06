import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiParty, CreatePartyPayload, UpdatePartyPayload } from '@/types/api/masters'

export function listVendors(page = 1): Promise<PaginatedEnvelope<ApiParty>> {
  return apiRequest('/api/v1/vendors', { query: { page, per_page: 100 } })
}

export function getVendor(id: number): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest(`/api/v1/vendors/${id}`)
}

export function createVendor(payload: CreatePartyPayload): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest('/api/v1/vendors', { method: 'POST', body: payload })
}

export function updateVendor(
  id: number,
  payload: UpdatePartyPayload,
): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest(`/api/v1/vendors/${id}`, { method: 'PUT', body: payload })
}

export function deleteVendor(id: number): Promise<void> {
  return apiRequest(`/api/v1/vendors/${id}`, { method: 'DELETE' })
}
